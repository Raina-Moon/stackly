# Setup Guide

## Initial Setup

### 1. Enable Yarn Berry

```bash
corepack enable
corepack prepare yarn@stable --activate
```

Verify installation:
```bash
yarn --version
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Start Database Services

```bash
docker-compose up -d
```

Verify PostgreSQL is running:
```bash
docker ps
```

### 4. Configure Backend Environment

Copy the example environment file (if needed):
```bash
cp apps/backend/.env.example apps/backend/.env
```

The `.env` file is already configured with default values matching the Docker Compose setup.

### 5. Start Development Servers

In the root directory:
```bash
yarn dev
```

Or start individually:
- Frontend: `cd apps/frontend && yarn dev`
- Backend: `cd apps/backend && yarn dev`

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **pgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432

## pgAdmin Setup

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@stackly.local`
   - Password: `admin`
3. Right-click "Servers" → "Register" → "Server"
4. General tab:
   - Name: `Stackly Local`
5. Connection tab:
   - Host: `postgres` (Docker service name)
   - Port: `5432`
   - Username: `stackly`
   - Password: `stackly_dev_password`
   - Save password: ✓
6. Click "Save"

## Notes

### Express Framework
NestJS uses Express.js under the hood via `@nestjs/platform-express`. You can access the Express instance if needed:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  // expressApp is the Express application instance
}
```

### Tailwind CSS
Tailwind is configured and ready to use. Import styles in your components or use Tailwind classes directly:

```tsx
<div className="flex items-center justify-center min-h-screen">
  <h1 className="text-4xl font-bold">Hello Stackly</h1>
</div>
```

## Troubleshooting

### Database Connection Issues
- Ensure Docker containers are running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify environment variables in `apps/backend/.env`

### Yarn Issues
- Clear Yarn cache: `yarn cache clean`
- Remove `.yarn` folder and reinstall: `rm -rf .yarn && yarn install`

### Port Conflicts
- Change ports in `docker-compose.yml` if 5432, 5050, 3000, or 3001 are in use
- Update corresponding environment variables




