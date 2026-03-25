# TeamBoard

Multi-tenant project management SaaS with kanban boards, team workspaces, and role-based access control.

**Live Demo:** [teamboard-web.vercel.app](https://teamboard-web.vercel.app)

---

## Architecture

```
                    ┌──────────────┐
                    │   Vercel     │
                    │  (Next.js)   │
                    │  Frontend    │
                    └──────┬───────┘
                           │ HTTPS
                           ▼
                    ┌──────────────┐
                    │   Railway    │
                    │  (NestJS)    │
                    │  Backend API │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  (Railway)   │
                    └──────────────┘
```

```
teamboard/
├── apps/
│   ├── web/               # Next.js 16 — Frontend
│   │   ├── src/app/       # App Router pages
│   │   ├── src/components/# UI components (kanban, theme, skeleton)
│   │   ├── src/hooks/     # Custom hooks (useApi, useKeyboardShortcuts)
│   │   ├── src/lib/       # Auth config, API client, utils
│   │   └── e2e/           # Playwright E2E tests
│   └── api/               # NestJS — Backend API
│       ├── src/auth/      # JWT auth, Google OAuth, password reset
│       ├── src/workspace/ # Workspace CRUD, member management
│       ├── src/board/     # Board + Column CRUD
│       ├── src/task/      # Task CRUD, move, search
│       ├── src/invitation/# Email invitations (Resend)
│       ├── src/comment/   # Task comments
│       ├── src/label/     # Task labels/tags
│       ├── src/attachment/ # File attachments (local disk)
│       ├── src/subscription/ # Stripe checkout + webhooks
│       └── prisma/        # Database schema + migrations
├── packages/
│   └── shared/            # Shared types, Zod schemas, constants
├── docker-compose.yml     # Local PostgreSQL
├── turbo.json             # Turborepo config
└── .github/workflows/     # CI/CD pipeline
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4, TanStack React Query |
| Backend | NestJS 11, Prisma ORM, Passport JWT |
| Database | PostgreSQL 16 |
| Auth | NextAuth v5 (credentials + Google OAuth) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Email | Resend |
| Payments | Stripe (test mode) |
| Testing | Playwright E2E (12 tests) |
| CI/CD | GitHub Actions |
| Deploy | Vercel (frontend) + Railway (API + DB) |
| Monorepo | Turborepo + pnpm workspaces |

## Features

### Authentication
- Email/password registration with confirmation
- Google OAuth login
- Password reset flow (forgot → email token → reset)
- JWT-based session management

### Multi-tenant Workspaces
- Each user gets an auto-created workspace on signup
- Invite members via email (token-based accept flow)
- Role system: Owner, Admin, Member
- Complete tenant isolation — every query filtered by workspace

### Kanban Boards
- Drag & drop tasks between columns (@dnd-kit)
- Default columns: Todo, In Progress, Review, Done
- Add, rename, delete columns
- Task creation inline from any column
- Keyboard shortcuts: `Esc` close modal, `Ctrl+Shift+N` new task

### Tasks
- Title, description, priority (Low/Medium/High/Urgent)
- Assignee, due date
- Labels/tags with color coding
- Comments with author + timestamp
- File attachments (upload, download, delete)

### Subscription & Billing
- Free plan: 1 workspace, 5 members
- Pro plan: unlimited ($12/mo via Stripe)
- Checkout session → webhook → subscription management
- Plan gating enforced at API level

### UI/UX
- Dark/light theme with system preference detection
- Skeleton loaders (no spinners)
- Toast notifications (Sonner)
- Mobile responsive sidebar with hamburger menu
- Landing page: hero, features, pricing, testimonials

### Production-Ready
- Rate limiting (60 req/min global, 5 req/min auth)
- Pagination + search on all list endpoints
- Sentry error tracking (optional, via env var)
- Global exception filter with structured error responses
- Playwright E2E test suite (12 passing)
- GitHub Actions CI/CD (lint, build, typecheck, e2e)

## Local Setup

### Prerequisites
- Node.js 22+
- pnpm 9+
- Docker (for PostgreSQL)

### 1. Clone and install

```bash
git clone https://github.com/MuratZrl/Teamboard.git
cd Teamboard
pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

```bash
# API
cp .env.example apps/api/.env
# Edit apps/api/.env — defaults work for local dev

# Web
cp .env.example apps/web/.env.local
# Add: NEXT_PUBLIC_API_URL=http://localhost:4000/api
# Add: NEXTAUTH_SECRET=any-random-string
# Add: NEXTAUTH_URL=http://localhost:3000
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start development

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:4000

### 6. Run tests

```bash
# Install Playwright browsers (first time only)
pnpm --filter @teamboard/web exec playwright install chromium

# Run E2E tests (start dev servers first)
pnpm --filter @teamboard/web test:e2e
```

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) | No |
| `PORT` | API port (default: `4000`) | No |
| `FRONTEND_URL` | Frontend URL for CORS + emails | Yes |
| `RESEND_API_KEY` | Resend API key for emails | No |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode) | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | No |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro plan | No |
| `SENTRY_DSN` | Sentry DSN for error tracking | No |

### Web (`apps/web/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Yes |
| `NEXTAUTH_URL` | Frontend URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Sign in | No |
| POST | `/api/auth/google` | Google OAuth | No |
| GET | `/api/auth/me` | Current user | JWT |
| POST | `/api/auth/forgot-password` | Request reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |

### Workspaces
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces` | Create workspace | JWT |
| GET | `/api/workspaces` | List workspaces | JWT |
| GET | `/api/workspaces/:id` | Get workspace | JWT + Member |
| PATCH | `/api/workspaces/:id` | Update workspace | JWT + Admin |
| DELETE | `/api/workspaces/:id` | Delete workspace | JWT + Owner |

### Invitations
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:id/invitations` | Send invite | JWT + Admin |
| GET | `/api/workspaces/:id/invitations` | List pending | JWT + Member |
| POST | `/api/invitations/accept` | Accept invite | JWT |

### Boards & Columns
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:id/boards` | Create board | JWT + Member |
| GET | `/api/workspaces/:id/boards` | List boards | JWT + Member |
| GET | `/api/boards/:id` | Get board (full) | JWT |
| DELETE | `/api/boards/:id` | Delete board | JWT |
| POST | `/api/boards/:id/columns` | Add column | JWT |
| PATCH | `/api/columns/:id/rename` | Rename column | JWT |
| DELETE | `/api/columns/:id` | Delete column | JWT |
| PATCH | `/api/boards/:id/columns/reorder` | Reorder columns | JWT |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/columns/:columnId/tasks` | Create task | JWT |
| PATCH | `/api/tasks/:id` | Update task | JWT |
| DELETE | `/api/tasks/:id` | Delete task | JWT |
| PATCH | `/api/tasks/:id/move` | Move task | JWT |
| GET | `/api/workspaces/:id/tasks` | Search tasks | JWT + Member |

### Comments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/comments` | Add comment | JWT |
| GET | `/api/tasks/:taskId/comments` | List comments | JWT |
| DELETE | `/api/comments/:id` | Delete comment | JWT (author) |

### Labels
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:id/labels` | Create label | JWT + Member |
| GET | `/api/workspaces/:id/labels` | List labels | JWT + Member |
| DELETE | `/api/labels/:id` | Delete label | JWT |

### Attachments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/attachments` | Upload file | JWT |
| GET | `/api/tasks/:taskId/attachments` | List files | JWT |
| GET | `/api/attachments/:id/download` | Download file | JWT |
| DELETE | `/api/attachments/:id` | Delete file | JWT (uploader) |

### Subscription
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:id/checkout` | Stripe checkout | JWT + Member |
| GET | `/api/workspaces/:id/subscription` | Get subscription | JWT + Member |
| POST | `/api/webhooks/stripe` | Stripe webhook | Signature |

## Database Schema

```
User ──< WorkspaceMember >── Workspace
  │                              │
  │── Task (assignee/creator)    │── Board ──< Column ──< Task
  │── Comment (author)           │── Label ──<< Task (many-to-many)
  │── Attachment (uploader)      │── Invitation
                                 │── Subscription
```

**Models:** User, Workspace, WorkspaceMember, Invitation, Board, Column, Task, Comment, Label, Attachment, Subscription

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | teamboard-web.vercel.app |
| API | Railway | teamboard-production-77f7.up.railway.app |
| Database | Railway PostgreSQL | Internal |

### Deploy your own

1. Fork this repo
2. **Railway:** New project → Deploy from GitHub → Add PostgreSQL → Set env vars → Deploy
3. **Vercel:** Import project → Root directory `apps/web` → Set env vars → Deploy

## License

MIT
