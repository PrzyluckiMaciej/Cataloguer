import { useState, useRef } from "react";
import { dbGetBlob } from "./db";
import { isBlobRef } from "./helpers";

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
      const chunks = [];
      
      chunks.push('{\n  "tabs": ' + JSON.stringify(state.tabs || []) + ',\n');
      chunks.push('  "lists": ' + JSON.stringify(state.lists || []) + ',\n');
      chunks.push('  "items": [\n');

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setExportProgress({ 
          current: i + 1, 
          total: items.length, 
          phase: `Processing: ${item.name || 'Unnamed'}` 
        });

        const processedItem = { ...item };

        if (item.thumbnail && isBlobRef(item.thumbnail)) {
          const blob = await dbGetBlob(item.thumbnail);
          processedItem.thumbnail = blob ? await blobToBase64(blob) : null;
        }

        if (item.images?.length > 0) {
          processedItem.images = await Promise.all(
            item.images.map(async (src) => {
              if (!isBlobRef(src)) return src;
              const blob = await dbGetBlob(src);
              return blob ? await blobToBase64(blob) : null;
            })
          );
          processedItem.images = processedItem.images.filter(Boolean);
        }

        if (item.videos?.length > 0) {
          processedItem.videos = await Promise.all(
            item.videos.map(async (v) => {
              if (v?.kind === "upload" && isBlobRef(v.src)) {
                const blob = await dbGetBlob(v.src);
                return blob ? { ...v, src: await blobToBase64(blob) } : null;
              }
              return v;
            })
          );
          processedItem.videos = processedItem.videos.filter(Boolean);
        }

        chunks.push(JSON.stringify(processedItem));
        if (i < items.length - 1) chunks.push(",\n");
        else chunks.push("\n");

        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
      }

      chunks.push('  ],\n');
      chunks.push(`  "_export_date": "${new Date().toISOString()}"\n}`);

      const finalBlob = new Blob(chunks, { type: "application/json" });
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cataloguer-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setExportProgress({ current: items.length, total: items.length, phase: "Complete!" });
    } catch (err) {
      console.error("Export failed:", err);
      setImportError(`Export failed: ${err.message}`);
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

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportError(null);
    setImporting(true); // Fixed: Changed from setExporting
    setImportProgress({ percent: 0, itemsProcessed: 0, phase: "Reading file..." }); // Fixed: Changed from setExportProgress
    
    const reader = new FileReader();
    
    reader.onload = async (ev) => {
      try {
        setImportProgress(prev => ({ ...prev, phase: "Parsing JSON (this may take a moment)..." }));
        
        const parsed = JSON.parse(ev.target.result);
        
        if (!parsed.tabs || !parsed.lists || !parsed.items) {
          throw new Error("Invalid format: missing required fields");
        }
        
        setImportProgress(prev => ({ ...prev, phase: "Migrating media to database..." }));
        
        const { migrateStateToBlobs } = await import("./db");
        
        const migrated = await migrateStateToBlobs(parsed);
        
        onImport(migrated);
        setImportError(null);
      } catch (err) {
        console.error("Import error:", err);
        setImportError(`Import failed: ${err.message}`);
      } finally {
        setImporting(false); // Fixed: Changed from setExporting
        e.target.value = ""; 
      }
    };

    reader.onerror = () => {
      setImportError("Failed to read the file.");
      setImporting(false);
    };

    reader.readAsText(file);
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