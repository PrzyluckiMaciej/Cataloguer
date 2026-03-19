import { useState } from "react";
import { G, css } from "../styles";
import EditableText from "./EditableText";
import ListCard from "./ListCard";
import ListView from "./ListView";
import ListFormModal from "./ListFormModal";
import NameFormModal from "./NameFormModal";
import ConfirmModal from "./ConfirmModal";

export default function TabView({
  state,
  activeTab,
  activeList,
  tabLists,
  activeTabId,
  onSetActiveList,
  onUpdateTab,
  onDeleteTab,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onDuplicateList,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
}) {
  const [modal, setModal] = useState(null);
  const [dragListIdx, setDragListIdx] = useState(null);
  const [overListIdx, setOverListIdx] = useState(null);

  const handleListReorder = (fromIdx, toIdx) => {
    if (fromIdx === null || fromIdx === toIdx) return;
    const reordered = [...tabLists];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    reordered.forEach((l, i) => onUpdateList({ ...l, order: i }));
    setDragListIdx(null);
    setOverListIdx(null);
  };

  return (
    <div style={{ flex: 1, width: "100%", boxSizing: "border-box" }}>

      {/* Breadcrumb header */}
      <div style={activeList
        ? { padding: "28px 32px 0" }
        : { maxWidth: 900, margin: "0 auto", padding: "28px 32px 0" }
      }>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          {activeList ? (
            <>
              <button
                onClick={() => onSetActiveList(null)}
                style={{ ...css.ghostBtn, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
              >
                ‹ {activeTab.name}
              </button>
              <span style={{ color: G.textDim, fontSize: 14 }}>›</span>
              <span style={{ fontSize: 22, letterSpacing: "0.04em" }}>{activeList.name}</span>
            </>
          ) : (
            <>
              <EditableText
                value={activeTab.name}
                onSave={(n) => onUpdateTab({ ...activeTab, name: n })}
                style={{ fontSize: 26, letterSpacing: "0.06em", fontWeight: "normal", cursor: "text" }}
              />
              <button
                style={{ ...css.iconBtn(false), fontSize: 13, color: G.textDim }}
                onClick={() => setModal("renameTab")}
                title="Rename tab"
              >✎</button>
              <button
                style={{ ...css.ghostBtn, fontSize: 11, marginLeft: 4 }}
                onClick={() => setModal("newList")}
              >
                + New list
              </button>
              {state.tabs.length > 1 && (
                <button
                  style={{ ...css.ghostBtn, fontSize: 11, color: G.danger, borderColor: G.dangerDim, marginLeft: "auto" }}
                  onClick={() => setModal({ type: "confirm", msg: `Delete tab "${activeTab.name}" and everything in it?`, fn: () => onDeleteTab(activeTab.id, state.tabs) })}
                >
                  Delete tab
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab overview */}
      {!activeList && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px 28px" }}>
          {tabLists.length === 0 && (
            <div style={{ color: G.textDim, fontStyle: "italic", fontSize: 13 }}>
              No lists yet. Create one to get started.
            </div>
          )}
          {tabLists.map((list, i) => (
            <ListCard
              key={list.id}
              list={list}
              itemCount={state.items.filter((it) => it.listId === list.id).length}
              onSelect={() => onSetActiveList(list.id)}
              onUpdate={onUpdateList}
              onDelete={() => onDeleteList(list.id)}
              onDuplicate={() => onDuplicateList(list.id)}
              onDragStart={() => setDragListIdx(i)}
              onDragOver={() => setOverListIdx(i)}
              onDrop={() => handleListReorder(dragListIdx, i)}
              onDragEnd={() => { setDragListIdx(null); setOverListIdx(null); }}
              isDragging={dragListIdx === i}
              isOver={overListIdx === i}
            />
          ))}
        </div>
      )}

      {/* List detail view */}
      {activeList && (
        <div style={{ padding: "0 32px 28px" }}>
          <ListView
            list={activeList}
            items={state.items}
            onUpdate={onUpdateList}
            onDelete={() => onDeleteList(activeList.id)}
            onItemCreate={onCreateItem}
            onItemUpdate={onUpdateItem}
            onItemDelete={onDeleteItem}
          />
        </div>
      )}

      {/* Modals */}
      {modal === "renameTab" && (
        <NameFormModal
          title="Rename Tab"
          initial={activeTab.name}
          onSave={(n) => { onUpdateTab({ ...activeTab, name: n }); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "newList" && (
        <ListFormModal
          tabId={activeTabId}
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