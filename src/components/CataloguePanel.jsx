import { useState } from "react";
import { G, css } from "../styles";
import EditableText from "./EditableText";
import ListView from "./ListView";
import ListFormModal from "./ListFormModal";
import ConfirmModal from "./ConfirmModal";

export default function CataloguePanel({
  catalogue, lists, items,
  onUpdateCat, onDeleteCat,
  onCreateList, onUpdateList, onDeleteList,
  onItemCreate, onItemUpdate, onItemDelete,
}) {
  const [modal, setModal] = useState(null);
  const catLists = lists.filter((l) => l.catalogueId === catalogue.id);

  return (
    <div style={{ marginBottom: 32 }}>

      {/* Catalogue header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ width: 3, height: 22, background: G.accent, flexShrink: 0 }} />
        <EditableText
          value={catalogue.name}
          onSave={(n) => onUpdateCat({ ...catalogue, name: n })}
          style={{ fontSize: 17, letterSpacing: "0.06em" }}
        />
        <span style={{ color: G.textDim, fontSize: 12 }}>({catLists.length} {catLists.length === 1 ? "list" : "lists"})</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button
            style={css.iconBtn(true)}
            onClick={() => setModal({ type: "confirm", msg: `Delete catalogue "${catalogue.name}" and all its lists?`, fn: onDeleteCat })}
            title="Delete catalogue"
          >✕</button>
        </div>
      </div>

      {/* Lists */}
      {catLists.map((list) => (
        <ListView
          key={list.id}
          list={list}
          items={items}
          onUpdate={onUpdateList}
          onDelete={() => onDeleteList(list.id)}
          onItemCreate={onItemCreate}
          onItemUpdate={onItemUpdate}
          onItemDelete={onItemDelete}
        />
      ))}

      {catLists.length === 0 && (
        <div style={{ color: G.textDim, fontStyle: "italic", fontSize: 13, marginBottom: 12 }}>
          No lists yet.
        </div>
      )}

      <button
        style={{ ...css.ghostBtn, fontSize: 11 }}
        onClick={() => setModal("newList")}
      >
        + New list in {catalogue.name}
      </button>

      {/* Modals */}
      {modal === "newList" && (
        <ListFormModal
          catalogueId={catalogue.id}
          onSave={(list) => { onCreateList(list); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "confirm" && (
        <ConfirmModal message={modal.msg} onConfirm={modal.fn} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
