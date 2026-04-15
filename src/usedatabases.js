import { useState, useEffect, useCallback } from "react";
import { uid } from "./helpers";
import {
  dbGetDatabases, dbSetDatabases,
  dbGetActiveDbId, dbSetActiveDbId,
  dbDeleteDatabase,
} from "./db";

export function useDatabases() {
  const [databases, setDatabases] = useState(null);   
  const [activeDbId, setActiveDbIdState] = useState(null);

  useEffect(() => {
    (async () => {
      const dbs = await dbGetDatabases();
      const activeId = await dbGetActiveDbId();
      
      const valid = dbs.find((d) => d.id === activeId) ? activeId : dbs[0]?.id;
      setDatabases(dbs);
      setActiveDbIdState(valid || null);
    })();
  }, []);

  const switchDatabase = useCallback(async (id) => {
    await dbSetActiveDbId(id);
    setActiveDbIdState(id);
  }, []);

  const createDatabase = useCallback(async (name) => {
    const db = { id: uid(), name: name.trim(), createdAt: Date.now() };
    const next = [...(databases || []), db];
    await dbSetDatabases(next);
    setDatabases(next);
    await switchDatabase(db.id);
    return db;
  }, [databases, switchDatabase]);

  const renameDatabase = useCallback(async (id, name) => {
    const next = databases.map((d) => d.id === id ? { ...d, name: name.trim() } : d);
    await dbSetDatabases(next);
    setDatabases(next);
  }, [databases]);

  const deleteDatabase = useCallback(async (id) => {
    await dbDeleteDatabase(id);
    const next = databases.filter((d) => d.id !== id);
    await dbSetDatabases(next);
    setDatabases(next);

    if (activeDbId === id) {
      const fallback = next[0]?.id || null;
      if (fallback) await switchDatabase(fallback);
      else setActiveDbIdState(null);
    }
  }, [databases, activeDbId, switchDatabase]);

  return {
    databases,
    activeDbId,
    switchDatabase,
    createDatabase,
    renameDatabase,
    deleteDatabase,
  };
}