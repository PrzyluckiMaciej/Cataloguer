import { useState, useRef } from "react";

export function useDataIO(state, onImport) {
  const [importError, setImportError] = useState(null);
  const importRef = useRef();

  const handleExport = () => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cataloguer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.tabs || !parsed.lists || !parsed.items) throw new Error("Invalid format");
        onImport(parsed);
        setImportError(null);
      } catch {
        setImportError("Import failed — the file doesn't look like a valid backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const openImportPicker = () => importRef.current.click();
  const clearImportError = () => setImportError(null);

  return { importRef, importError, handleExport, handleImport, openImportPicker, clearImportError };
}