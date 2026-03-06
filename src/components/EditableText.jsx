import { useState, useEffect, useRef } from "react";
import { G } from "../styles";

export default function EditableText({ value, onSave, style, placeholder = "Untitled" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef();

  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim()) onSave(draft.trim());
    else setDraft(value);
  };

  if (!editing) {
    return (
      <span
        style={{ ...style, cursor: "text" }}
        onDoubleClick={() => { setDraft(value); setEditing(true); }}
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      style={{
        ...style,
        background: G.surfaceHigh,
        border: `1px solid ${G.accentDim}`,
        color: G.text,
        padding: "2px 4px",
        fontFamily: "inherit",
        fontSize: "inherit",
        outline: "none",
      }}
    />
  );
}
