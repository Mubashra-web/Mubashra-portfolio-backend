# Portfolio Backend

REST API for the `portfolio-frontend` static site + admin panel. Every piece
of content on the public site — profile/bio, profile picture, contact info
(email, phone, GitHub, LinkedIn, etc.), skills, education, work experience,
and projects — is stored in MongoDB and fully editable from the admin panel,
protected by a single admin login (JWT auth).

```
portfolio-backend/
├── server.js                 # App entry point
├── package.json
├── .env.example
├── uploads/                  # Uploaded profile pictures (served at /uploads/...)
├── scripts/
│   └── seed.js                # Creates the first admin user
└── src/
    ├── config/db.js           # MongoDB connection
    ├── models/                 # Admin, Profile, Project, Skill, Experience, Education
    ├── middleware/              # auth (JWT), upload (multer), errorHandler
    ├── controllers/             # Route handlers (profile + generic CRUD factory)
    └── routes/                   # Express routers, mounted under /api
```

## 1. Setup

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable         | Description                                                            |
|-------------------|--------------------------------------------------------------------------|
| `PORT`            | Port the API listens on (default `5000`)                                |
| `MONGO_URI`       | MongoDB connection string (local `mongodb://127.0.0.1:27017/portfolio` or an Atlas URI) |
| `JWT_SECRET`      | Long random string used to sign login tokens                             |
| `JWT_EXPIRES_IN`  | Token lifetime, e.g. `7d`                                                |
| `FRONTEND_URL`    | Exact origin the frontend is served from (CORS is locked to this)        |
| `ADMIN_USERNAME`  | Used only by `npm run seed` to create your first admin login             |
| `ADMIN_PASSWORD`  | Used only by `npm run seed` (min 6 characters)                           |

```bash
npm install
npm run seed     # creates the admin account (and an empty profile doc)
npm run dev       # starts on http://localhost:5000 with auto-reload
# or: npm start
```

## 2. Point the frontend at it

Serve `portfolio-frontend/` with any static server (e.g. `npx serve .`), then
open the admin panel at `/admin/` and log in with the `ADMIN_USERNAME` /
`ADMIN_PASSWORD` from your `.env`. If the API isn't on `http://localhost:5000`,
set the correct URL from the admin login screen ("change API URL") or the
Settings tab.

## API Reference

All responses are JSON: `{ "success": true, "data": ... }` on success, or
`{ "success": false, "message": "..." }` on error. Protected routes require
`Authorization: Bearer <token>` (the token returned by login).

### Auth
| Method | Path                        | Auth | Description               |
|--------|------------------------------|------|-----------------------------|
| POST   | `/api/auth/login`             | –    | `{ username, password }` → `{ token, user }` |
| POST   | `/api/auth/logout`            | –    | No-op (client discards token) |
| PUT    | `/api/auth/change-password`   | ✅   | `{ currentPassword, newPassword }` |

### Profile (single document)
| Method | Path                     | Auth | Description |
|--------|----------------------------|------|-------------|
| GET    | `/api/profile`              | –    | Public profile data |
| PUT    | `/api/profile`              | ✅   | Update name, title, bio, email, phone, location, github, linkedin, twitter, website, resumeUrl |
| POST   | `/api/profile/picture`      | ✅   | multipart/form-data, field `picture` (jpg/png/webp/gif, ≤5MB) |
| DELETE | `/api/profile/picture`      | ✅   | Removes the current picture |

### Projects / Skills / Experience / Education
Each resource shares the same CRUD shape:

| Method | Path                        | Auth |
|--------|------------------------------|------|
| GET    | `/api/<resource>`             | –    |
| POST   | `/api/<resource>`             | ✅   |
| PUT    | `/api/<resource>/:id`         | ✅   |
| DELETE | `/api/<resource>/:id`         | ✅   |

Where `<resource>` is `projects`, `skills`, `experience`, or `education`.

**Project fields:** `title, category, description, longDescription, technologies[], imageUrl, order, liveUrl, githubUrl, featured`

**Skill fields:** `name, category, proficiency (0-100), order, iconUrl`

**Experience fields:** `jobTitle, company, location, employmentType, startDate, endDate, current, description, responsibilities[], technologies[], order`

**Education fields:** `degree, institution, location, grade, startDate, endDate, description, order`

Lists are returned sorted by `order` ascending, then by creation date.

## Uploaded files

Profile pictures are saved to `uploads/` and served statically at
`/uploads/<filename>`. The frontend resolves this automatically against
whatever API URL it's configured with (see `assetUrl()` in the frontend's
`js/config.js`) — no extra config needed here.

## Deployment notes

- Any Node host works (Railway, Render, Fly.io, a VPS, etc.). Set the same
  env vars there, and point `FRONTEND_URL` at wherever the static frontend
  ends up being hosted.
- `uploads/` is local disk storage — fine for a single-instance deploy. If
  you move to multiple instances or a platform with an ephemeral
  filesystem, swap `src/middleware/upload.js` for an object-storage
  provider (S3, Cloudinary, etc.) and store the returned URL in
  `profilePicture` / `imageUrl` as normal (absolute URLs pass straight
  through the frontend's `assetUrl()` helper).
- Never commit `.env` — only `.env.example` is meant to be shared.
