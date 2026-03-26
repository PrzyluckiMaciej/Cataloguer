# Cataloguer

A personal item cataloguing app built with React. Organise anything into lists, rank them, attach images and videos, and browse everything in a clean dark interface.

---

## Features

- **Tabs → Lists → Items** hierarchy — tabs act as top-level sections, each containing any number of lists
- **Three list types**
  - *Numbered* — ordered ranking with rank numbers shown per item
  - *Unranked* — simple collection with no ranking
  - *Tiered* — tier grid (S/A/B/C/D by default); items are dragged between tiers; tiers are fully renameable, reorderable, and individually coloured
- **Grid or row view** — toggle between a card grid and a row layout per list; grid column count (2–6) is adjustable and persisted per list
- **Item search** — filter items within a list by name in real time; drag-and-drop is disabled while a search is active
- **Drag and drop** — reorder items within a list, reorder lists within a tab, and reorder tier rows within a tiered list
- **List duplication** — duplicate any list along with all its items in one click
- **Item positioning** — when editing an item you can set its exact position (1 to N) within the list
- **Item images** — each item supports a thumbnail (with a built-in crop tool) and a gallery of additional images including GIFs
- **Item videos** — each item supports video attachments in two forms:
  - *Embedded links* — paste a URL from YouTube, Instagram, or Facebook to play it inline
  - *Uploaded files* — upload MP4, WebM, or MOV files directly (up to 50 MB each); played via the browser's native video player
- **Media gallery** — full-screen lightbox with filmstrip navigation; supports images, GIFs, embedded videos, and uploaded video files in a single unified view
  - Images support scroll-to-zoom (up to 4×) and drag-to-pan while zoomed
  - Filmstrip is draggable and automatically scrolls to keep the active item centred; keyboard arrow keys navigate between media
- **Inline renaming** — double-click any tab or list name to rename it in place; a pencil button offers an alternative modal rename for tabs
- **Custom scrollbar** — a styled overlay scrollbar that matches the app's dark aesthetic, visible on hover/scroll and hidden when content fits without scrolling
- **Export / Import** — back up all data (including images and uploaded videos) as a single JSON file and restore it at any time

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

All data is stored in the browser's **IndexedDB** — no backend or database setup required. Data persists across page refreshes and browser restarts. Saves are debounced (500 ms after the last change) to avoid unnecessary writes.

> **Note:** IndexedDB data is tied to the browser profile. To avoid data loss, use the **Export** button in the top bar regularly to save a JSON backup.
>
> **Note on video files:** Uploaded videos are stored as base64 inside IndexedDB, which increases their size by approximately 33%. A 50 MB video will occupy around 67 MB of storage. Export backups include all uploaded videos and can become large if many files are attached.

---

## Project Structure

```
src/
├── App.jsx                  # Thin orchestrator — wires hooks and top-level components
├── useAppState.js           # All state, IndexedDB persistence, and CRUD operations
├── useDataIO.js             # Export to JSON and import from JSON
├── db.js                    # IndexedDB read/write wrapper
├── helpers.js               # uid(), fileToBase64(), constants, initial state
├── styles.js                # Design tokens and shared style objects
└── components/
    ├── TopBar.jsx            # Nav bar — tabs, + Tab button, export/import
    ├── TabView.jsx           # Breadcrumb header, tab overview, list detail view
    ├── Modal.jsx             # Base modal wrapper (Escape to close, backdrop click to close)
    ├── EditableText.jsx      # Double-click inline text editing
    ├── CustomScrollbar.jsx   # Overlay scrollbar — cross-browser, hides when not needed
    ├── ListCard.jsx          # List summary row shown on the tab overview
    ├── ListView.jsx          # Full list view — grid/row toggle, search, drag-and-drop
    ├── ItemCard.jsx          # Item row card (row view)
    ├── ItemGridCard.jsx      # Item card (grid view, hover actions)
    ├── GalleryModal.jsx      # Full-screen media lightbox — images, GIFs, embedded and uploaded videos
    ├── VideoEmbed.jsx        # Platform video embed (YouTube, Instagram, Facebook) and URL parser
    ├── ItemFormModal.jsx     # Create/edit item form — name, position, thumbnail, images, videos
    ├── ListFormModal.jsx     # Create/edit list form — name, type, tier configuration
    ├── ThumbnailCropper.jsx  # Square crop tool for item thumbnails
    ├── NameFormModal.jsx     # Simple name input modal (used for tabs)
    └── ConfirmModal.jsx      # Delete confirmation dialog
```