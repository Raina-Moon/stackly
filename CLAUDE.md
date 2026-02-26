# CLAUDE.md - Stackly Project Instructions

## Project Overview

Stackly is a real-time collaborative kanban board application.
It is a Turborepo-based monorepo consisting of a frontend (Next.js 14), backend (NestJS 10), and shared packages (Proto, WASM).

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, TanStack Query, Tailwind CSS, Socket.IO Client, next-intl (i18n: en/ko), @dnd-kit
- **Backend**: NestJS 10, TypeORM 0.3, PostgreSQL 16, Redis 7, Passport JWT, Socket.IO, web-push, Resend (email)
- **Shared**: Protocol Buffers (protobufjs), Rust WASM (wasm-pack)
- **Infra**: Docker Compose, Turborepo, Yarn Berry (4.6)

## Commands

```bash
# Dev server
yarn dev                          # All (frontend + backend)

# Build
yarn build                        # Build all

# Lint & Test
yarn lint                         # Lint all
yarn test                         # Test all

# Backend only
cd apps/backend && yarn start:dev  # Dev mode
cd apps/backend && yarn test       # Test

# DB migrations
cd apps/backend && yarn migration:generate src/migrations/<Name>
cd apps/backend && yarn migration:run

# Proto build
cd packages/proto && yarn build

# WASM build
cd packages/wasm && yarn build

# Docker (PostgreSQL, Redis, pgAdmin)
docker compose up -d
```

## Project Structure

```
stackly/
├── apps/
│   ├── frontend/          # Next.js 14 App Router
│   │   ├── src/app/[locale]/   # Locale-based routing
│   │   ├── src/components/     # Feature-based components (board/, settings/, auth/, etc.)
│   │   ├── src/contexts/       # AuthContext, SocketContext, ToastContext
│   │   ├── src/hooks/          # Custom hooks (useBoard, useCard, etc.)
│   │   ├── src/lib/            # API client, socket utilities
│   │   └── src/messages/       # i18n translation files (en.json, ko.json)
│   └── backend/           # NestJS 10 modular architecture
│       ├── src/entities/       # TypeORM entities
│       ├── src/modules/        # auth, kanban, schedules, realtime, friends
│       ├── src/cache/          # Redis cache layer
│       └── src/migrations/     # DB migrations
├── packages/
│   ├── proto/             # Protobuf message definitions
│   └── wasm/              # Rust WASM module
```

## Architecture & Design Rules

### General

- All code must be written in TypeScript strict mode.
- Prefer editing existing files over creating new ones.
- Do not create unnecessary abstractions. Keep only the minimum complexity needed for the current task.
- Never introduce security vulnerabilities (SQL injection, XSS, command injection, etc.).

### Frontend Rules

- **Routing**: Use Next.js App Router with `[locale]` dynamic segments.
- **Server State**: Manage via TanStack Query. Do not manage server data directly with `useState`.
- **Client State**: Use Context API (Auth, Socket, Toast).
- **Components**: Organize by feature (`components/board/`, `components/settings/`, etc.).
- **Styling**: Use Tailwind CSS only. No inline styles or CSS modules.
- **i18n**: All user-facing strings must be added to `messages/en.json` and `messages/ko.json` and used via `next-intl`. No hardcoded strings.
- **Hooks**: Extract business logic into custom hooks (`hooks/useBoard.ts` pattern).
- **Real-time**: Manage Socket.IO events through `SocketContext`.

### Backend Rules

- **Module Structure**: Follow NestJS module pattern (Controller → Service → Entity).
- **DTO**: Validate all API inputs with DTO classes.
- **Auth**: JWT-based. Use `@GetUser()` decorator and `JwtAuthGuard`.
- **Caching**: Use the Redis cache layer. Always handle cache invalidation when data changes.
- **DB**: Use TypeORM entities and migrations. `synchronize: true` is only for development.
- **Real-time**: Handle WebSocket communication via Socket.IO Gateway. Serialize messages with Protobuf.
- **Notifications**: Follow the NotificationEvent → NotificationDelivery pipeline.

### Database Rules

- When adding a new table, always create the TypeORM entity first, then generate a migration.
- Define relations explicitly in entities.
- Add indexes on frequently queried columns.

## Code Style

- **Prettier**: singleQuote, trailingComma: all
- **ESLint**: Follow TypeScript ESLint rules
- Function names: camelCase, class names: PascalCase, file names: kebab-case
- NestJS files use suffixes: `.controller.ts`, `.service.ts`, `.module.ts`, `.entity.ts`, `.dto.ts`, `.guard.ts`

## Git & Workflow

- Commit messages follow Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Commit messages are written in English.

## Environment

- Ports: Frontend 3000, Backend 3001, PostgreSQL 5432, Redis 6379, pgAdmin 5050
- Docker Compose manages PostgreSQL, Redis, and pgAdmin.
- Refer to `.env.example` for environment variable configuration.

---

> Edit this file to add any additional rules or design guidelines.
> Claude Code automatically reads this file at the start of every conversation and follows it as instructions.
