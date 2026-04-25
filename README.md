# Full-Stack Kanban Board

A highly polished, full-stack Kanban board built to manage project tasks across dynamic, customizable lists. Originally a standard technical assessment, this project has been elevated into a robust SaaS prototype featuring a relational database architecture, multi-image attachments, and a modern glassmorphic UI.

## Key Features

- **Dynamic Column Management:** Create custom lists on the fly. Includes cascading database relationships and a "Danger Zone" confirmation modal to prevent accidental data loss when deleting populated lists.
- **Advanced Drag-and-Drop Physics:** Powered by `@dnd-kit/sortable`, featuring dynamic velocity-based card tilting, cross-column sorting, and real-time optimistic UI updates for a zero-latency feel.
- **Multi-Image Galleries:** Attach multiple cover images to a single task. Images are serialized as JSON arrays in the backend and displayed in a horizontally scrollable gallery within the task details modal.
- **Modern Glassmorphism UI:** Fully responsive, utility-first UI built with Tailwind CSS, featuring a vibrant pink/rose palette, soft radial gradients, and native vertical scaling.
- **Resilient Architecture:** Built-in loading states, graceful error handling for database disconnects, and auto-reverting state fallbacks if server mutations fail.
- **Auto-Seeding Database:** The Express backend automatically detects empty databases on startup and injects standard default lists (`To Do`, `In Progress`, `Done`) to ensure a smooth first-time user experience.

## Tech Stack

**Frontend:**

- React (via Vite)
- Tailwind CSS
- `@dnd-kit` (Drag & Drop Physics)
- `react-hot-toast` (Notifications)

**Backend:**

- Node.js & Express
- Prisma ORM (v7 Adapter)
- SQLite (`better-sqlite3`)

## Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### 1. Installation

Clone the repository and install dependencies for both the frontend and backend environments.

```bash
# Clone the repo
git clone https://github.com/christian-manalang/trello-clone-assessment.git
cd trello-clone-assessment

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

Initialize the SQLite database and sync the Prisma schema.

```bash
cd backend
npx prisma db push
```

### 3. Running the Application

You will need two terminal windows to run the frontend and backend concurrently.

Terminal 1: Start the Backend

```bash
cd backend
npm run dev
# Server will start on http://localhost:3000
# Note: The server will automatically seed the default columns on its first run.
```

Terminal 2: Start the Frontend

```bash
cd frontend
npm run dev
# Vite will start on http://localhost:5173
```

Open http://localhost:5173 in your browser to interact with the board.

## Technical Decisions & Workarounds

- Relational Architecture: Moved away from hardcoded string statuses to a true relational model (Column 1:N Ticket). This allows for infinite list creation and utilizes Prisma's onDelete: Cascade for clean data management.

- JSON Image Storage: To support multiple attachments without overcomplicating the SQLite schema with a third junction table, image URLs are safely serialized and parsed as JSON arrays within the Ticket model.

- Optimistic UI: Drag-and-drop operations immediately update the React state before the server responds. If the PATCH requests fail, the UI automatically fetches the source of truth from the database to instantly correct itself.

- Prisma v7 Adapter: Implemented a specific configuration workaround for @prisma/adapter-better-sqlite3 to ensure stable absolute pathing and prevent string parsing errors during local development.
