# THE VOSS FILES — Official Portal & Community Platform

> **Academic Context:** MCA Semester III Mini Project-II  
> **Institution:** S. K. Patel Institute of Management and Computer Studies (SKPIMCS), Kadi Sarva Vishwavidyalaya, Gandhinagar  
> **Team:** Dave Dhyey Sanjay Kumar (Roll 39, Enrolment 25MCA02023) & Prajapati Biren JitendraKumar (Roll 54, Enrolment 25MCA02010) — Group 12  
> **Faculty Guide:** Dr. Sejal Haveliwala  
> **Development Start Date:** 15 June 2026  

---

## 1. Project Overview

*THE VOSS FILES* is a first-person 3D psychological mystery escape-room game developed in Unity 6 (C#, Universal Render Pipeline) targeting Windows PC and Android.

This repository hosts the game's **official web portal and community platform**. It provides narrative documentation, downloadable builds, an automated leaderboard connected to the game client via REST API, a developer blog with community discussion, an auditor feedback/bug tracker, and a comprehensive administrative content management system.

---

## 2. Technology Stack

- **Runtime & Server:** Node.js (v18+) with Express.js
- **Database:** SQLite3 via `better-sqlite3` (with WAL mode and foreign key constraints enabled)
- **Templating:** EJS (Embedded JavaScript)
- **Styling:** Custom Vanilla CSS (Dark navy `#0a0e1a`, muted gold `#c9a84c`, off-white typography, zero heavy CSS frameworks)
- **Authentication:** Session-based with `express-session` & `bcryptjs` password hashing (salt rounds: 12)
- **Security & Headers:**
  - HTTP Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`
  - Anti-CSRF session token protection on all mutating forms
  - Multi-tier rate limiting via `express-rate-limit` on Authentication, Comments, Feedback, and Game API
  - File upload MIME and extension verification with randomized disk filenames
  - Output escaping across all views to prevent XSS injection.

---

## 3. Getting Started

### Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### Setup Commands
```bash
# 1. Navigate to the project directory
cd "D:\The voss files Website"

# 2. Install dependencies
npm install

# 3. Seed database with initial chapters, admin user, and sample posts
npm run seed

# 4. Start the server
npm start
```

Visit **`http://localhost:3000`** in your browser.

### Default Admin Credentials (from Seeder)
- **Username:** `admin`
- **Password:** `VossAdmin2026!`
- **Email:** `admin@vossfiles.local`
*(Credentials are changeable immediately via database or profile upon initial sign-in.)*

---

## 4. Directory Structure

```
D:\The voss files Website/
├── .env                  # Environment configuration (PORT, DB_PATH, SESSION_SECRET)
├── .env.example          # Template environment file
├── .gitignore            # Git exclusion rules
├── package.json          # Node dependencies and scripts
├── app.js                # Express entry point, security headers, middleware wiring, error handlers
├── db/
│   ├── database.js       # SQLite connection wrapper with WAL mode
│   ├── schema.sql        # 8-table relational schema with indexes & constraints
│   ├── seed.js           # Seeder for admin, 6 chapters, blog posts, placeholder builds
│   └── vossfiles.db      # SQLite database file (created automatically)
├── middleware/
│   ├── auth.js           # requireLogin, requireAdmin, active user verification
│   ├── csrf.js           # CSRF token generation and validation middleware
│   └── upload.js         # Multer configuration for builds and screenshots with MIME validation
├── routes/
│   ├── index.js          # Public routes: home, game, story, download, leaderboard, feedback, about
│   ├── auth.js           # User registration, login, logout, profile & API token management
│   ├── blog.js           # Paginated developer blog and post comment threads
│   ├── api.js            # Game-facing REST API for score submission
│   └── admin.js          # Admin dashboard and full CMS controllers
├── public/
│   ├── css/
│   │   └── style.css     # Bespoke clinical dark navy & gold design system
│   ├── js/
│   │   └── main.js       # Mobile navigation, spoiler toggle, token copying, dynamic UI
│   └── uploads/
│       ├── builds/       # Uploaded standalone executable and APK packages
│       └── screenshots/  # Uploaded in-engine gameplay captures
└── views/
    ├── partials/
    │   ├── header.ejs    # Global navigation, metadata, and flash messages
    │   ├── footer.ejs    # Academic footnotes and quick links
    │   └── flash.ejs     # Dynamic flash notification alerts
    ├── errors/
    │   ├── 403.ejs       # Security restriction error page
    │   ├── 404.ejs       # Missing archive dossier error page
    │   └── 500.ejs       # System malfunction error page
    ├── auth/             # Login, register, profile
    ├── blog/             # Blog list, post detail with comments
    ├── admin/            # Dashboard, chapters, builds, posts, screenshots, feedback, users, scores
    └── *.ejs             # Core public views (home, game, story, characters, screenshots, etc.)
```

---

## 5. Entity Relationship (ER) Description

The database schema (`db/schema.sql`) models 8 core relational entities:

1. **`users`**
   - Attributes: `id` (PK), `username` (UNIQUE), `email` (UNIQUE), `password_hash`, `role` (`player` | `admin`), `is_active`, `api_token` (UNIQUE), `created_at`.
   - Relationships: One-to-Many with `blog_posts`, `comments`, `scores`, and `feedback`.
2. **`chapters`**
   - Attributes: `id` (PK), `slug` (UNIQUE), `title`, `setting`, `summary`, `mechanic`, `status` (`Planned` | `In development` | `Playable`), `sort_order`.
   - Relationships: One-to-Many with `scores` and `screenshots`.
3. **`builds`**
   - Attributes: `id` (PK), `version`, `platform` (`Windows` | `Android`), `release_date`, `file_path`, `file_size`, `notes`, `is_published`, `created_at`.
4. **`blog_posts`**
   - Attributes: `id` (PK), `title`, `slug` (UNIQUE), `body`, `author_id` (FK -> users), `is_published`, `created_at`.
   - Relationships: One-to-Many with `comments`.
5. **`comments`**
   - Attributes: `id` (PK), `post_id` (FK -> blog_posts), `user_id` (FK -> users), `body`, `created_at`.
6. **`screenshots`**
   - Attributes: `id` (PK), `chapter_id` (FK -> chapters, nullable), `caption`, `file_path`, `sort_order`.
7. **`scores`**
   - Attributes: `id` (PK), `user_id` (FK -> users), `chapter_id` (FK -> chapters), `time_seconds`, `hints_used`, `created_at`.
8. **`feedback`**
   - Attributes: `id` (PK), `user_id` (FK -> users, nullable), `type` (`bug` | `review` | `suggestion`), `rating` (1–5), `message`, `status` (`open` | `resolved`), `created_at`.

---

## 6. Game Integration API

### `POST /api/scores`
Allows the offline Unity game build to submit player completion times directly to the global leaderboard.

- **Authentication:** Personal API Token (passed in request JSON body as `api_token`). Players retrieve and regenerate their token from their `/profile` page.
- **Rate Limit:** 30 requests per minute per IP address.

#### Request Headers:
```http
Content-Type: application/json
```

#### Request Body Example:
```json
{
  "api_token": "3b234e84-fe75-4d49-a7d1-8201f25fc559",
  "chapter_slug": "chapter-1",
  "time_seconds": 145.2,
  "hints_used": 1
}
```

#### Field Specifications:
- `api_token` *(string, required)*: Valid UUID assigned to an active user.
- `chapter_slug` *(string, required)*: Slug of existing chapter (e.g. `chapter-1`, `chapter-2`).
- `time_seconds` *(float, required)*: Elapsed time in seconds (`> 0` and `<= 86400`).
- `hints_used` *(integer, required)*: Number of hints taken (`>= 0`).

#### Success Response (`201 Created`):
```json
{
  "success": true,
  "score_id": 1,
  "rank": 1
}
```

#### Error Responses:
- `400 Bad Request`: Validation failure or unknown chapter slug.
- `401 Unauthorized`: Invalid or missing `api_token`.
- `403 Forbidden`: Account is marked inactive/disabled.
- `429 Too Many Requests`: Rate limit exceeded.

---

## 7. Feature Summary by Page

| Page | Route | Description & Features |
|---|---|---|
| **Home** | `/` | Hero tagline, CTA to download, 3 core game highlights, chapter cards, latest 3 blog dispatches. |
| **The Game** | `/game` | Narrative premise, psychological dread philosophy, PC keyboard/mouse & Android touch controls table. |
| **Story & Chapters** | `/story` | 6 chapters with settings and statuses; spoiler-free cards + interactive collapsible spoiler disclosure for true ending lore. |
| **Characters** | `/characters` | Dossiers for Investigator, Dr. Elena Voss, Daniel Lowe (Subject 7), The Caretaker, and Mr. Calloway. |
| **Screenshots** | `/screenshots` | In-engine visual archive with verified placeholders (no synthetic/AI fake images). |
| **Download** | `/download` | Releases for PC & Android; disabled "Coming Soon" states for placeholder builds without files. |
| **How It Is Built** | `/how-its-built` | Technical breakdown of Unity 6 URP, `IInteractable` pattern, `GameManager` singleton, and `BookPlacer` tool. |
| **Leaderboard** | `/leaderboard` | Best completion times per chapter and overall standings with hint counts and tie-breaking. |
| **Dev Blog** | `/blog` | Paginated development articles; article detail page with comment threads for registered players. |
| **Feedback** | `/feedback` | Bug report, review rating (1-5 stars), and suggestion form with validation, rate-limiting, and thank-you view. |
| **About** | `/about` | MCA project context, college info, student profiles (Dhyey & Biren), guide, and development timeline. |
| **Auth** | `/login`, `/register`, `/logout` | Secure bcrypt authentication, rate-limiting, session state, CSRF tokens, and semantic `<h1>` tags. |
| **My Profile** | `/profile` | Auditor account details, private Game API Token with one-click copy & regeneration, score history, feedback status. |
| **Admin Dashboard** | `/admin` | Complete CMS: stats overview, chapter editor, build uploader, post publisher, screenshot gallery, feedback resolver, user role manager, and score moderator. |
