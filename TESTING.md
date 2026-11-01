# THE VOSS FILES — Comprehensive Quality Audit & Testing Report

This document records the quality audit pass, finding resolution matrix, and verification test results conducted on **THE VOSS FILES** web portal.

---

## 1. Audit Findings & Resolution Matrix

| Issue ID | File / Component | Problem Identified | Severity | Status | Resolution Summary |
|---|---|---|---|---|---|
| **ISS-01** | `db/seed.js` & `views/story.ejs` | Epilogue chapter summary exposed the true ending Caretaker reveal directly on public cards. | **High** | **FIXED** | Replaced Epilogue summary with spoiler-light text ("Enter the maintenance sub-level..."). Full lore kept exclusively inside the collapsed Spoilers section. |
| **ISS-02** | `routes/auth.js` | No rate limiting on `/login` and `/register` endpoints against brute-force attacks. | **High** | **FIXED** | Added `authLimiter` (15 attempts / 15 mins) with clean user-facing error rendering. |
| **ISS-03** | `routes/index.js` | No rate limiting on `POST /feedback` form against automated spam tickets. | **Medium** | **FIXED** | Added `feedbackLimiter` (10 submissions / 15 mins). |
| **ISS-04** | `routes/blog.js` | No rate limiting on `POST /blog/:slug/comment` against rapid comment flooding. | **Medium** | **FIXED** | Added `commentLimiter` (15 comments / 15 mins) with flash notifications. |
| **ISS-05** | `app.js` | Missing standard HTTP security headers. | **Medium** | **FIXED** | Injected middleware setting `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, and `Referrer-Policy`. |
| **ISS-06** | `app.js` | Missing static asset cache-control headers. | **Low** | **FIXED** | Configured `express.static` with `maxAge: '1d'`. |
| **ISS-07** | `views/*` (Login, Register, Admin, Errors) | Templates lacked semantic `<h1>` tags, using `<h2>` or `<h3>` for primary page titles. | **Medium** | **FIXED** | Standardized all pages to feature exactly one top-level semantic `<h1>`. |
| **ISS-08** | `views/story.ejs` | Spoiler disclosure toggle button lacked `aria-controls` and container lacked `id`. | **Medium** | **FIXED** | Added `aria-controls="spoiler-content"` to toggle and `id="spoiler-content"` to container. |
| **ISS-09** | `public/css/style.css` | Missing motion preference accessibility query. | **Medium** | **FIXED** | Added `@media (prefers-reduced-motion: reduce)` disabling animations, transforms, and transitions. |
| **ISS-10** | `views/screenshots.ejs` | Gallery images lacked lazy loading and graceful missing image fallback. | **Low** | **FIXED** | Added `loading="lazy"` and `onerror` fallback to placeholder DOM card. |
| **ISS-11** | `middleware/upload.js` | Upload filter validated file extension but omitted MIME type validation. | **Medium** | **FIXED** | Added strict MIME type whitelisting for images and build archives. |
| **ISS-12** | `routes/index.js` | Leaderboard query lacked tie-breaking logic. | **Low** | **FIXED** | Updated query to order by `time_seconds ASC, hints_used ASC, created_at ASC`. |
| **ISS-13** | `db/schema.sql` | Missing index on builds for published release query. | **Low** | **FIXED** | Added `CREATE INDEX IF NOT EXISTS idx_builds_published ON builds(is_published, release_date DESC)`. |

---

## 2. Test Execution Results (Post-Fix)

### A. Functional Checks
- **Every Route:** All public routes (`/`, `/game`, `/story`, `/characters`, `/screenshots`, `/download`, `/how-its-built`, `/leaderboard`, `/blog`, `/feedback`, `/about`, `/login`, `/register`) return HTTP 200 without console or server errors.
- **Role Enforcement:**
  - Anonymous visitor accessing `/profile` -> Redirected to `/login` (302).
  - Anonymous visitor accessing `/admin/*` -> 403 Forbidden.
  - Player role accessing `/admin/*` -> 403 Forbidden.
  - Admin access -> Full CMS access.
- **CSRF Token Validation:** Form POSTs without valid `_csrf` tokens reject with 403 Forbidden.
- **Score API (`POST /api/scores`):**
  - Missing token -> 400 Bad Request.
  - Negative time -> 400 Bad Request.
  - Time > 24 hours -> 400 Bad Request.
  - Float hints -> 400 Bad Request.
  - Invalid token -> 401 Unauthorized.
  - Valid submission -> 201 Created with correct rank.

### B. Content Accuracy
- **Spoiler Isolation:** Verified that the Epilogue summary displayed on `/story` cards is strictly spoiler-light ("Enter the maintenance sub-level..."). The caretaker reveal appears solely inside the collapsed `#spoiler-content` container.
- **Controls & Systems:** PC and Android tables verified with authentic keybindings and touch joystick descriptions.
- **Academic Context:** Student names, roll numbers, enrolment IDs, guide (Dr. Sejal Haveliwala), and 15 June 2026 kickoff verified.

### C. Visual & Layout Polish
- Verified on viewports 1440px (Desktop), 1024px (Tablet Landscape / Laptop), 768px (Tablet Portrait), and 390px (Mobile):
  - No horizontal scrolling (`overflow-x: hidden` on body).
  - Hamburger navigation activates cleanly below 1024px with accessible toggle.
  - Tables maintain responsive horizontal scroll wrappers (`table-wrapper`).
  - Colors meet WCAG AA contrast (Gold `#c9a84c` on Navy `#0a0e1a` ratio 7.5:1).

### D. Security & Performance
- HTTP headers verified: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`.
- Static caching verified: `cache-control: public, max-age=86400` (or 3600 in dev).
- Seed script repeatability: verified clean execution without duplicate records or constraint errors.
