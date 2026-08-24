# beanHelps

beanHelps is a mental-health peer-support and community platform for people
dealing with anxiety, stress, loneliness, grief, burnout, and similar
challenges. It helps people discover moderated communities, take part in
discussions, and join smaller support circles, with optional guidance from
verified volunteer therapists.

> beanHelps is a peer-support platform. It is not an emergency service and is
> not a replacement for professional diagnosis, treatment, or crisis care.

## What it does

The platform supports three roles:

- **Beaners** are community members. They can complete a support profile, use a
  privacy-facing display name, join curated forums, write posts and nested
  comments, find support groups, use group chat, attend meetings, report unsafe
  content, and view a daily kindness quote.
- **Beanpists** are volunteer therapists. Once verified, they can publish
  resources, host forum meetings, create therapist-led support groups, and work
  with their assigned circles.
- **Admins** review therapist applications and moderate reported content using
  report summaries, priority indicators, and moderation actions.

### Core features

- JWT-based authentication and role-based access
- Separate curated forums and private, structured support groups
- Tag-based support-group matching and a persistent waitlist
- Privacy aliases on community-facing content
- Forum posts, nested comments, meetings, and therapist resources
- Support-group membership, chat, and meeting management
- Therapist onboarding and admin verification
- User reporting and administrative moderation
- Daily kindness quotes with a built-in fallback

## Tech stack

- **Frontend:** React 19, React Router, Vite, and Lucide React
- **Backend:** Node.js, Express, JWT, bcrypt, Helmet, CORS, and Morgan
- **Database:** MongoDB with Mongoose
- **Deployment:** The frontend and API can be deployed independently; the API
  includes optional Render keep-alive support.

## Project structure

```text
beanHelps/
├── apps/
│   ├── api/       # Express API, feature modules, middleware, and models
│   └── web/       # React/Vite frontend
├── docs/          # Architecture, project brief, and design documentation
└── scripts/       # Data-seeding utilities
```

## Run locally

### Prerequisites

- Node.js
- npm
- A MongoDB database

### 1. Configure the API

Create `apps/api/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/beanhelps
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
```

Install dependencies and start the backend:

```bash
cd apps/api
npm install
npm run dev
```

The health endpoint is available at
`http://localhost:5000/api/health`.

### 2. Configure the frontend

Create `apps/web/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

In a second terminal, install dependencies and start Vite:

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:5173`.

## Useful commands

Run these commands from the relevant app directory:

```bash
# apps/web
npm run dev
npm run build
npm run lint

# apps/api
npm run dev
npm start
npm run seed:demo
```

The additional `scripts/seedForums.js` script can be used to populate the
curated forums.

## Render keep-alive

The API periodically requests its own `GET /api/health` endpoint. On Render,
`RENDER_EXTERNAL_URL` is used automatically. The default interval is 10
minutes.

To customize it, add either of these environment variables to the API service:

```env
SELF_PING_INTERVAL_MS=600000
SELF_PING_URL=https://your-api.onrender.com/api/health
```

`SELF_PING_URL` is optional on Render. If neither it nor
`RENDER_EXTERNAL_URL` is available, self-pinging remains disabled, such as
during local development.
