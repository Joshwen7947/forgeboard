# ForgeBoard

![ForgeBoard Logo](placeholder-logo) <!-- Placeholder for logo; replace with actual if available -->

ForgeBoard is a developer-focused Kanban application built on Cloudflare Workers with Durable Objects for seamless persistence. It delivers a visually refined, minimalist interface optimized for clarity and velocity. Projects contain boards, boards contain columns (Backlog, In Progress, Review, Done) with draggable task cards, and tasks include title, description, assignee, labels, estimate, and status. The app emphasizes a polished single-page Board View experience alongside a Projects hub for managing multiple boards.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Joshwen7947/forgeboard)

## Features

- **Drag-and-Drop Kanban Boards**: Intuitive task management with smooth animations using @dnd-kit.
- **Persistent Storage**: Cloudflare Durable Objects ensure data durability across sessions without external databases.
- **Task Management**: Create, edit, assign, and track tasks with rich details like markdown descriptions, labels, and estimates.
- **Projects Hub**: Centralized view for listing, previewing, and quick-creating boards.
- **Responsive Design**: Mobile-first interface with horizontal scrolling columns on small screens and a full-screen task editor.
- **Optimistic UI**: Instant feedback on interactions with rollback on errors, powered by React Query.
- **Visual Excellence**: Modern UI with shadcn/ui components, Tailwind CSS, and Framer Motion micro-interactions.
- **Collaboration Ready**: Foundation for real-time presence, comments, and notifications in future phases.

## Tech Stack

- **Frontend**: React 18, React Router, TypeScript, Tailwind CSS v3, shadcn/ui, Framer Motion (animations), @dnd-kit (drag-and-drop), React Query (data fetching/caching), React Hook Form (forms), React Markdown (description rendering), Lucide React (icons), Sonner (toasts), Zustand (state management).
- **Backend**: Hono (routing), Cloudflare Workers (serverless), Durable Objects (stateful persistence), Zod (validation).
- **Build Tools**: Vite (bundling), Bun (package manager), Wrangler (Cloudflare CLI).
- **Utilities**: UUID (ID generation), Immer (immutable updates), clsx & Tailwind Merge (class utilities).

## Quick Start

### Prerequisites

- Node.js 18+ (or Bun for faster installs)
- Cloudflare account (free tier sufficient for development)
- Wrangler CLI installed: `bun install -g wrangler`

### Installation

1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd forgeboard
   ```

2. Install dependencies using Bun:
   ```
   bun install
   ```

3. Set up environment variables (optional for local dev; required for production):
   ```
   cp .env.example .env
   # Edit .env with your Cloudflare account ID if needed
   ```

4. Start the development server:
   ```
   bun dev
   ```
   The app will be available at `http://localhost:3000`.

### Local Testing

- Frontend: Runs on Vite dev server with hot reloading.
- Backend: Simulated via Wrangler; Durable Objects persist in-memory for dev.
- API Endpoints: Test at `/api/boards`, `/api/board/:id`, etc. (see [API section](#api) for details).

## Development

### Running in Development Mode

- **Frontend Only**: `bun dev` (starts Vite on port 3000).
- **Full Stack (with Worker)**: Use Wrangler for end-to-end testing:
  ```
  bun wrangler dev
  ```
  This proxies API calls to a local Worker instance.

- **Type Generation**: Regenerate Cloudflare types after Worker changes:
  ```
  bun run cf-typegen
  ```

### Project Structure

- `src/`: React frontend (pages, components, hooks).
- `worker/`: Hono-based API routes and Durable Object implementation.
- `shared/`: Shared types and mock data (extend for production).
- `src/components/ui/`: shadcn/ui primitives (do not modify).

### Adding Features

1. **Frontend Components**: Use shadcn/ui for new UI elements; follow Tailwind non-negotiables for layout.
2. **API Routes**: Add to `worker/userRoutes.ts` following the pattern (e.g., GET/POST to Durable Object methods).
3. **Durable Object Methods**: Extend `worker/durableObject.ts` with typed methods returning full board snapshots.
4. **State Management**: Use Zustand for local state; React Query for API data with optimistic updates.
5. **Testing**: Unit tests with Vitest (add as needed); manual testing via dev server.

### Common Commands

- Lint: `bun lint`
- Build: `bun build`
- Preview: `bun preview`
- Deploy: `bun deploy` (see Deployment section).

## API

The backend exposes REST endpoints via Hono on Cloudflare Workers. All requests use JSON payloads and return `ApiResponse<T>` format.

### Key Endpoints

- `GET /api/boards`: List all projects/boards.
- `GET /api/board/:id`: Fetch full board (columns + tasks).
- `POST /api/board/:id/task`: Create a task.
- `PUT /api/board/:id/task/:taskId`: Update task.
- `DELETE /api/board/:id/task/:taskId`: Delete task.
- `POST /api/board/:id/move-task`: Move task (drag-and-drop).

Data is namespaced in Durable Objects (e.g., `board:{id}` keys). Use shared types from `shared/types.ts` for type safety.

### Error Handling

- Success: `{ success: true, data: T }`
- Error: `{ success: false, error: string }` (HTTP 4xx/5xx)

## Deployment

Deploy to Cloudflare Workers for global, edge-distributed hosting with Durable Objects for persistence.

### Steps

1. Authenticate with Wrangler:
   ```
   bun wrangler login
   ```

2. Configure Secrets (if any):
   ```
   bun wrangler secret put YOUR_SECRET
   ```

3. Deploy:
   ```
   bun deploy
   ```
   Or use the Wrangler dashboard for CI/CD integration.

4. Custom Domain (Optional):
   - Add via Cloudflare Dashboard: Workers > Your Worker > Triggers > Custom Domains.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Joshwen7947/forgeboard)

### Production Notes

- **Persistence**: Durable Objects handle state; no external DB needed.
- **Scaling**: Workers auto-scale; DOs provide strong consistency.
- **Monitoring**: Enable via Wrangler: `bun wrangler tail` for logs.
- **Phases**: This is Phase 1 (core board with mock data). See `implementationRoadmap` in blueprint for future enhancements.

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit changes: `git commit -m 'Add amazing feature'`.
4. Push: `git push origin feature/amazing-feature`.
5. Open a Pull Request.

Follow TypeScript strict mode, ESLint rules, and UI non-negotiables. Focus on visual excellence and error-free deployments.

## License

MIT License. See [LICENSE](LICENSE) for details.