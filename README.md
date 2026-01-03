# Stackly

Stackly is a high performance scheduling engine designed to turn project chaos into visual clarity. This monorepo contains a Kanban board and schedule management service with FDS integration.

## Monorepo Structure

This project uses [Turborepo](https://turbo.build/repo) for monorepo management.

```
stackly/
├── apps/
│   ├── frontend/          # Next.js application (React + TypeScript)
│   └── backend/           # NestJS application (Node.js + TypeScript)
├── package.json           # Root package.json with Turborepo config
├── turbo.json             # Turborepo configuration
└── README.md              # This file
```

## Prerequisites

- Node.js >= 18.0.0
- Yarn Berry (Yarn 4+) - Install with: `corepack enable` then `corepack prepare yarn@stable --activate`
- Docker & Docker Compose (for PostgreSQL and pgAdmin)

## Getting Started

### Installation

1. Enable Yarn Berry (if not already enabled):
```bash
corepack enable
corepack prepare yarn@stable --activate
```

2. Install dependencies for all workspaces:
```bash
yarn install
```

### Database Setup

Start PostgreSQL and pgAdmin using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL: `localhost:5432`
  - Database: `stackly_db`
  - Username: `stackly`
  - Password: `stackly_dev_password`
- pgAdmin: http://localhost:5050
  - Email: `admin@stackly.local`
  - Password: `admin`

To stop the database services:
```bash
docker-compose down
```

### Development

Run all applications in development mode:

```bash
yarn dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

**Note:** Make sure PostgreSQL is running before starting the backend.

### Running Individual Applications

**Frontend only:**
```bash
cd apps/frontend
yarn dev
```

**Backend only:**
```bash
cd apps/backend
yarn dev
```

## Available Scripts

### Root Level

- `yarn build` - Build all applications
- `yarn dev` - Start all applications in development mode
- `yarn lint` - Lint all applications
- `yarn test` - Run tests for all applications
- `yarn clean` - Clean build artifacts

### Frontend (`apps/frontend`)

- `yarn dev` - Start Next.js development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

### Backend (`apps/backend`)

- `yarn dev` - Start NestJS in watch mode
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn test` - Run unit tests
- `yarn test:e2e` - Run end-to-end tests

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI**: React 18
- **Styling**: Tailwind CSS 3.4+

### Backend
- **Framework**: NestJS 10+ (uses Express under the hood)
- **Language**: TypeScript
- **Runtime**: Node.js
- **Database**: PostgreSQL 16 (via TypeORM)
- **ORM**: TypeORM

### Database & Tools
- **PostgreSQL**: PostgreSQL 16 (Docker)
- **Database Admin**: pgAdmin 4 (Docker)
- **ORM**: TypeORM with NestJS integration

### Monorepo
- **Tool**: Turborepo
- **Package Manager**: Yarn Berry (Yarn 4+)

## Project Structure

### Frontend (`apps/frontend/`)
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components
- `src/lib/` - Utility functions and helpers

### Backend (`apps/backend/`)
- `src/main.ts` - Application entry point
- `src/app.module.ts` - Root module with TypeORM configuration
- `src/modules/` - Feature modules (kanban, schedules)

### Database Configuration
- `docker-compose.yml` - PostgreSQL and pgAdmin Docker setup
- `apps/backend/.env.example` - Environment variables template

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Private And Just For Fun
