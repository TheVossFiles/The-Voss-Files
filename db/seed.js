/**
 * Seed script for THE VOSS FILES database.
 * Run with: npm run seed
 *
 * Seeds: admin account, six chapters, two blog posts, one placeholder build.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ── Admin credentials ──────────────────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_EMAIL    = 'admin@vossfiles.local';
const ADMIN_PASSWORD = 'VossAdmin2026!';

console.log('\n╔══════════════════════════════════════════════════╗');
console.log('║   THE VOSS FILES — Database Seeder               ║');
console.log('╚══════════════════════════════════════════════════╝\n');

// ── Helper: clear existing data ────────────────────────────
function clearData() {
  const tables = ['comments', 'scores', 'feedback', 'screenshots', 'blog_posts', 'builds', 'chapters', 'users'];
  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
  console.log('✓ Cleared existing data.');
}

// ── Seed admin ─────────────────────────────────────────────
function seedAdmin() {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
  const token = uuidv4();

  db.prepare(`
    INSERT INTO users (username, email, password_hash, role, is_active, api_token)
    VALUES (?, ?, ?, 'admin', 1, ?)
  `).run(ADMIN_USERNAME, ADMIN_EMAIL, hash, token);

  console.log('✓ Admin account created:');
  console.log(`    Username : ${ADMIN_USERNAME}`);
  console.log(`    Password : ${ADMIN_PASSWORD}`);
  console.log(`    Email    : ${ADMIN_EMAIL}`);
  console.log(`    API Token: ${token}`);
  console.log('  ⚠  Change these credentials after first login!\n');
}

// ── Seed chapters ──────────────────────────────────────────
function seedChapters() {
  const chapters = [
    {
      slug: 'prologue',
      title: 'Prologue — "Arrival"',
      setting: 'Institute lobby',
      summary: 'A voicemail from Mr. Calloway sets the task. The caretaker lets you in. You pick up a flashlight and a building directory. The investigation begins.',
      mechanic: 'Introduction sequence, item pickup (flashlight, building directory), environmental storytelling.',
      status: 'Planned',
      sort_order: 0
    },
    {
      slug: 'chapter-1',
      title: 'Chapter 1 — "The Archive"',
      setting: "Elena's study (antechamber and main study)",
      summary: "Navigate a dark antechamber using only your flashlight. Find the breaker box to restore light to Elena's study. Read her journals and a memo. Solve a chain of locked objects: a free drawer gives a DrawerKey, which opens a desk drawer containing a LockboxKey, which opens a hidden lockbox behind a filing cabinet containing the ArchiveKey and half of a torn photograph.",
      mechanic: 'Flashlight navigation, breaker puzzle, chained key-lock progression, document reading, item discovery.',
      status: 'Playable',
      sort_order: 1
    },
    {
      slug: 'chapter-2',
      title: 'Chapter 2 — "Records & Denial"',
      setting: 'Reception, records room, and back office',
      summary: 'A cold, grey office space. A noticeboard shows a partial patient ID (4-7-2-_). Find the admission photo in a filing cabinet — its back reveals the full code. Enter the code on a keypad to open a safe containing a falsified discharge report with Elena\'s margin notes.',
      mechanic: 'Environmental clue hunting, keypad combination puzzle, document analysis.',
      status: 'In development',
      sort_order: 2
    },
    {
      slug: 'chapter-3',
      title: 'Chapter 3 — "Ward 7"',
      setting: "Subject 7's living quarters",
      summary: 'Explore Daniel Lowe\'s room. Use the UV lamp to reveal hidden wall writing: "STILL COUNTING." Discover unsent letters behind a vent panel. Find the second half of the torn photograph.',
      mechanic: 'UV lamp mechanic, hidden environmental writing, vent panel interaction, photograph reunification.',
      status: 'Planned',
      sort_order: 3
    },
    {
      slug: 'chapter-4',
      title: 'Chapter 4 — "The Chamber"',
      setting: 'Control room and isolation chamber',
      summary: 'Enter the control room overlooking the isolation chamber. Four buttons — Calibration, Induction, Stimulus, Reinforcement — must be pressed in an order revealed under UV light. A cabinet yields a damaged tape reel and a splicing tool. Combine them into a repaired tape and play Elena\'s final recorded session.',
      mechanic: 'Sequence puzzle (UV-revealed order), item combination (tape reel + splicing tool), audio playback narrative.',
      status: 'In development',
      sort_order: 4
    },
    {
      slug: 'epilogue',
      title: 'Epilogue — "What\'s Left"',
      setting: 'Maintenance room',
      summary: 'Enter the maintenance sub-level. Uncover the final records of Dr. Elena Voss and piece together the fate of Blackwood\'s volunteers.',
      mechanic: 'Narrative reveal, closing cinematic sequence.',
      status: 'Planned',
      sort_order: 5
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO chapters (slug, title, setting, summary, mechanic, status, sort_order)
    VALUES (@slug, @title, @setting, @summary, @mechanic, @status, @sort_order)
  `);

  for (const ch of chapters) {
    stmt.run(ch);
  }
  console.log(`✓ Seeded ${chapters.length} chapters.\n`);
}

// ── Seed blog posts ────────────────────────────────────────
function seedBlogPosts() {
  // Get admin id
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_USERNAME);

  const posts = [
    {
      title: 'Welcome to THE VOSS FILES',
      slug: 'welcome-to-the-voss-files',
      body: `We're excited to announce THE VOSS FILES — a first-person psychological mystery escape-room game set in the abandoned Blackwood Institute.\n\nAs an unnamed compliance auditor, you'll navigate the facility, uncovering the research files of Dr. Elena Voss and the truth about what happened to a volunteer known only as Subject 7.\n\nThis game is being developed as part of our MCA Semester III Mini Project-II at S. K. Patel Institute of Management and Computer Studies. We're building it in Unity 6 with the Universal Render Pipeline, targeting both Windows PC and Android.\n\nStay tuned for development updates, behind-the-scenes posts, and early screenshots as we bring Blackwood Institute to life.\n\n— Dave & Biren`,
      author_id: admin.id,
      is_published: 1
    },
    {
      title: 'Development Update: Chapter 1 Playable',
      slug: 'development-update-chapter-1-playable',
      body: `Great news — Chapter 1, "The Archive," is now in a playable state!\n\nThis chapter introduces the core gameplay loop: flashlight exploration in the dark antechamber, restoring power via the breaker box, and solving the chained key-lock puzzles in Elena's study.\n\nKey features implemented so far:\n\n• Flashlight mechanic with realistic light cone\n• Breaker box interaction to restore room lighting\n• Chained item progression (DrawerKey → LockboxKey → ArchiveKey)\n• Document reading system with fade-in text\n• Half of the torn photograph discovery\n\nWe're currently working on Chapter 2's keypad puzzle and the records room environment. Chapter 4's sequence puzzle is also in early development.\n\nFeedback and bug reports are welcome through the Feedback page.\n\n— Dave`,
      author_id: admin.id,
      is_published: 1
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO blog_posts (title, slug, body, author_id, is_published)
    VALUES (@title, @slug, @body, @author_id, @is_published)
  `);

  for (const post of posts) {
    stmt.run(post);
  }
  console.log(`✓ Seeded ${posts.length} blog posts.\n`);
}

// ── Seed placeholder build ─────────────────────────────────
function seedBuilds() {
  db.prepare(`
    INSERT INTO builds (version, platform, release_date, file_path, file_size, notes, is_published)
    VALUES ('0.1.0-alpha', 'Windows', '2026-10-31', NULL, NULL, 'First alpha build — Chapter 1 only. This is a placeholder entry; the build file has not been uploaded yet.', 1)
  `).run();

  db.prepare(`
    INSERT INTO builds (version, platform, release_date, file_path, file_size, notes, is_published)
    VALUES ('0.1.0-alpha', 'Android', '2026-10-31', NULL, NULL, 'Android alpha build — coming soon.', 1)
  `).run();

  console.log('✓ Seeded 2 placeholder builds (no files attached).\n');
}

// ── Run all seeds ──────────────────────────────────────────
try {
  clearData();
  seedAdmin();
  seedChapters();
  seedBlogPosts();
  seedBuilds();

  console.log('══════════════════════════════════════════════════');
  console.log('  Database seeded successfully!');
  console.log('  Run `npm start` to launch the website.');
  console.log('══════════════════════════════════════════════════\n');
} catch (err) {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
}
