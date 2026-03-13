# Cataloguer

A personal item cataloguing app built with React. Organise anything into lists, rank them, attach images, and browse everything in a clean dark interface.

---

## Features

- **Tabs → Lists → Items** hierarchy — tabs act as top-level sections, each containing any number of lists
- **Three list types**
  - *Numbered* — ordered ranking with rank numbers
  - *Unranked* — simple collection with no ranking
  - *Tiered* — S/A/B/C/D tier grid, items dragged between tiers (tiers are renameable)
- **Grid or row view** — toggle between a card grid and a row layout per list; grid column count (2–6) is adjustable and saved per list
- **Drag and drop** — reorder items within a list, and reorder lists within a tab
- **Item images** — each item supports a thumbnail and a gallery of additional images; clicking the gallery opens a full-screen lightbox with filmstrip navigation and keyboard arrow support
- **Inline renaming** — double-click any tab or list name to rename it in place
- **Export / Import** — back up all data (including images) as a single JSON file and restore it at any time

---

## Getting Started

**Requirements:** Node.js 14+

```bash
npx create-react-app cataloguer
cd cataloguer
```

Delete everything inside `src/`, then copy the contents of this project's `src/` folder in its place, preserving the `components/` subdirectory structure.

```bash
npm start
```

The app runs at `http://localhost:3000`.

---

## Storage

All data is stored in the browser's **IndexedDB** — no backend or database setup required. Data persists across page refreshes and browser restarts.

> **Note:** IndexedDB data is tied to the browser profile. To avoid data loss, use the **Export** button in the top bar regularly to save a JSON backup.

---

## Project Structure

```
src/
├── App.jsx              # Thin orchestrator — wires hooks and top-level components
├── useAppState.js       # All state, IndexedDB persistence, and CRUD operations
├── useDataIO.js         # Export to JSON and import from JSON
├── db.js                # IndexedDB read/write wrapper
├── helpers.js           # uid(), fileToBase64(), constants, initial state
├── styles.js            # Design tokens and shared style objects
└── components/
    ├── TopBar.jsx        # Nav bar — tabs, + Tab button, export/import
    ├── TabView.jsx       # Breadcrumb header, tab overview, list detail view
    ├── Modal.jsx         # Base modal wrapper
    ├── EditableText.jsx  # Double-click inline text editing
    ├── ListCard.jsx      # List summary row shown on the tab overview
    ├── ListView.jsx      # Full list view with grid/row toggle and drag-and-drop
    ├── ItemCard.jsx      # Item row card (row view)
    ├── ItemGridCard.jsx  # Item card (grid view, hover actions)
    ├── GalleryModal.jsx  # Full-screen image lightbox
    ├── ItemFormModal.jsx # Create/edit item form
    ├── ListFormModal.jsx # Create/edit list form
    ├── NameFormModal.jsx # Simple name input modal (tabs)
    └── ConfirmModal.jsx  # Delete confirmation dialog
```