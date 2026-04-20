import { useState, useRef } from "react";
import { dbGetBlob, dbSetBlob, base64ToBlob } from "./db";

export function useDataIO(state, onImport) {
  const [importError, setImportError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ percent: 0, itemsProcessed: 0, phase: "" });
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, phase: "" });
  const importRef = useRef();
  const importAbortController = useRef(null);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Failed to read blob: ${reader.error?.message || 'unknown error'}`));
      reader.readAsDataURL(blob);
    });
  };

  const handleExport = async () => {
    if (!state) return;
    
    const items = state.items || [];
    if (items.length === 0) {
      alert("No items to export");
      return;
    }

    setExporting(true);
    setExportProgress({ current: 0, total: items.length, phase: "Initializing..." });

    try {
      let writable = null;
      let streamSupported = false;

      if ('showSaveFilePicker' in window && window.isSecureContext) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: `cataloguer-full-backup-${new Date().toISOString().slice(0, 10)}.json`,
            types: [{ description: 'JSON Backup', accept: { 'application/json': ['.json'] } }]
          });
          writable = await handle.createWritable();
          streamSupported = true;
        } catch (err) {
          if (err.name === 'AbortError') { setExporting(false); return; }
          console.warn("Hardware streaming unavailable:", err);
        }
      }

      if (!streamSupported) {
        console.warn("WARNING: Browser does not support direct-to-disk streaming. Attempting to build file in RAM. This may crash for datasets > 2GB.");
      }

      const memoryChunks = [];
      const writeChunk = async (str) => {
        if (streamSupported) {
          await writable.write(str);
        } else {
          memoryChunks.push(str);
        }
      };

      await writeChunk('{\n  "tabs": ' + JSON.stringify(state.tabs || []) + ',\n');
      await writeChunk('  "lists": ' + JSON.stringify(state.lists || []) + ',\n');
      await writeChunk('  "items": [\n');

      for (let i = 0; i < items.length; i++) {
        setExportProgress({ 
          current: i + 1, 
          total: items.length, 
          phase: `Exporting: ${items[i].name || 'Unnamed'}` 
        });

        const item = items[i];
        let processedItem = { ...item };

        if (item.thumbnail && item.thumbnail.startsWith('blob:')) {
          const blob = await dbGetBlob(item.thumbnail);
          processedItem.thumbnail = blob ? await blobToBase64(blob) : null;
        }

        if (item.images?.length > 0) {
          processedItem.images = await Promise.all(
            item.images.map(async (src) => {
              if (!src?.startsWith('blob:')) return src;
              const blob = await dbGetBlob(src);
              return blob ? await blobToBase64(blob) : null;
            })
          );
          processedItem.images = processedItem.images.filter(Boolean);
        }

        if (item.videos?.length > 0) {
          processedItem.videos = await Promise.all(
            item.videos.map(async (v) => {
              if (v?.kind === "upload" && v.src?.startsWith('blob:')) {
                const blob = await dbGetBlob(v.src);
                return blob ? { ...v, src: await blobToBase64(blob) } : null;
              }
              return v;
            })
          );
          processedItem.videos = processedItem.videos.filter(Boolean);
        }

        let itemStr = JSON.stringify(processedItem);
        if (i < items.length - 1) itemStr += ",\n";
        else itemStr += "\n";

        await writeChunk(itemStr);

        processedItem = null;
        itemStr = null;

        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 15)); 
        }
      }

      await writeChunk('  ],\n  "_export_date": "' + new Date().toISOString() + '"\n}');

      if (streamSupported) {
        setExportProgress(prev => ({ ...prev, phase: "Closing file stream..." }));
        await writable.close();
      } else {
        setExportProgress(prev => ({ ...prev, phase: "Generating final memory blob..." }));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const finalBlob = new Blob(memoryChunks, { type: "application/json" });
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cataloguer-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        memoryChunks.length = 0; 
      }

      setExportProgress({ current: items.length, total: items.length, phase: "Complete!" });
    } catch (err) {
      console.error("Export failed:", err);
      setImportError(`Export Error: ${err.message || 'Out of memory / Stream failed'}`); 
    } finally {
      setExporting(false);
      setTimeout(() => setExportProgress({ current: 0, total: 0, phase: "" }), 2000);
    }
  };

  const cancelImport = () => {
    if (importAbortController.current) {
      importAbortController.current.abort();
    }
    setImporting(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportError(null);
    setImporting(true);
    setImportProgress({ percent: 0, itemsProcessed: 0, phase: "Initializing stream..." });
    
    importAbortController.current = new AbortController();
    const signal = importAbortController.current.signal;

    try {
      const migratedState = { tabs: [], lists: [], items: [] };
      const stream = file.stream();
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let buffer = "";
      let bytesRead = 0;
      const totalSize = file.size;

      while (true) {
        if (signal.aborted) throw new Error("Import cancelled by user");

        const { done, value } = await reader.read();
        if (done) break;

        bytesRead += value.byteLength;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          if (line.startsWith('"tabs":')) {
            const arrStr = line.substring(7).trim().replace(/,$/, '');
            try { migratedState.tabs = JSON.parse(arrStr); } catch (err) {}
          } 
          else if (line.startsWith('"lists":')) {
            const arrStr = line.substring(8).trim().replace(/,$/, '');
            try { migratedState.lists = JSON.parse(arrStr); } catch (err) {}
          } 
          else if (line.startsWith('{') && (line.endsWith('}') || line.endsWith('},'))) {
            const objStr = line.endsWith(',') ? line.slice(0, -1) : line;
            
            try {
              const item = JSON.parse(objStr);
              if (item.id) {
                let { thumbnail, images = [], videos = [] } = item;

                if (thumbnail && thumbnail.startsWith("data:")) {
                  const blobKey = `blob:thumb:${item.id}`;
                  await dbSetBlob(blobKey, base64ToBlob(thumbnail));
                  thumbnail = blobKey;
                }

                images = await Promise.all(images.map(async (src, i) => {
                  if (typeof src === "string" && src.startsWith("data:")) {
                    const blobKey = `blob:img:${item.id}:${i}`;
                    await dbSetBlob(blobKey, base64ToBlob(src));
                    return blobKey;
                  }
                  return src;
                }));

                videos = await Promise.all(videos.map(async (v, i) => {
                  if (typeof v === "object" && v.kind === "upload" && v.src?.startsWith("data:")) {
                    const blobKey = `blob:vid:${item.id}:${i}`;
                    await dbSetBlob(blobKey, base64ToBlob(v.src));
                    return { ...v, src: blobKey };
                  }
                  return v;
                }));

                migratedState.items.push({ ...item, thumbnail, images, videos });
              }
            } catch (err) {
              // Ignore invalid JSON lines
            }
          }
        }

        setImportProgress({
          percent: Math.round((bytesRead / totalSize) * 100),
          itemsProcessed: migratedState.items.length,
          phase: "Streaming and extracting media..."
        });
      }

      if (migratedState.tabs.length === 0 || migratedState.items.length === 0) {
        throw new Error("Could not parse file structure. Ensure this is a valid Cataloguer backup.");
      }

      setImportProgress(prev => ({ ...prev, phase: "Finalizing import..." }));
      onImport(migratedState);

    } catch (err) {
      if (err.message !== "Import cancelled by user") {
        console.error("Import error:", err);
        setImportError(`Import failed: ${err.message}`);
      }
    } finally {
      setImporting(false);
      e.target.value = ""; 
    }
  };

  return { 
    importRef, 
    importError, 
    importing,
    importProgress,
    exporting, 
    exportProgress,
    handleExport, 
    handleImport, 
    cancelImport,
    clearImportError: () => setImportError(null)
  };
}