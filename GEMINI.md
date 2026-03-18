# Gantt Project Context

This is a modern Gantt Chart application built with **Next.js 16**, **React 19**, and **Prisma**, following a **Modular Hexagonal Architecture**.

## Project Overview

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4.
- **Architecture:** Hexagonal (Ports & Adapters) for backend logic.
- **Gantt Visualization:** `gantt-task-react`.
- **UI Components:** Shadcn/UI (Radix UI) and Lucide Icons.
- **Database:** SQLite with Prisma ORM.

## Hexagonal Architecture

The project is organized into domain modules within `src/modules`:

### Project Module (`src/modules/project`)
- **Domain:** Entity and Repository interface (Port).
- **Application:** Use cases (e.g., `EnsureDefaultProject`).
- **Infrastructure:** Prisma implementation (Adapter).

### Task Module (`src/modules/task`)
- **Domain:** Entity and Repository interface (Port).
- **Application:** Use cases (CRUD operations).
- **Infrastructure:** Prisma implementation (Adapter).

### Primary Adapters
- **Server Actions:** Located in `src/app/actions`, they act as controllers that instantiate repositories and execute use cases.

## Data Model

- **Project:** Container for tasks.
- **Task:** Unit of work with dates, progress, type, and dependencies.

## Key Commands

- `npm install`: Install dependencies.
- `npx prisma db push`: Sync database schema.
- `npm run dev`: Start development server.
- `npm run lint`: Run code quality checks.

## Development Conventions

- **Clean Architecture:** Keep business logic in the `application` layer, away from Prisma or Next.js specifics.
- **Dependency Injection:** Use interfaces (Ports) in use cases and inject concrete implementations (Adapters) in Server Actions.
- **Styling:** Tailwind CSS 4. Task labels inside bars are hidden via `src/app/globals.css`.
- **Interactions:** Right-click on a selected task to open the context menu for deletion.
