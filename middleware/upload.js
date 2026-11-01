/**
 * File upload configuration using Multer.
 * Separate uploaders for builds and screenshots.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 100) * 1024 * 1024;

// Ensure upload directories exist
const buildDir = path.join(__dirname, '..', 'public', 'uploads', 'builds');
const screenshotDir = path.join(__dirname, '..', 'public', 'uploads', 'screenshots');

[buildDir, screenshotDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ── Build uploads ──────────────────────────────────────────
const buildStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, buildDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `build-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const buildUpload = multer({
  storage: buildStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.zip', '.apk', '.exe', '.rar', '.7z'];
    const allowedMimes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
      'application/vnd.android.package-archive',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-msdownload'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed. Allowed: ${allowedExts.join(', ')}`));
    }
  }
});

// ── Screenshot uploads ─────────────────────────────────────
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, screenshotDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `screenshot-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB for screenshots
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) && (allowedMimes.includes(file.mimetype) || file.mimetype === 'application/octet-stream')) {
      cb(null, true);
    } else {
      cb(new Error(`Image format or mime ${file.mimetype} not allowed. Allowed: ${allowedExts.join(', ')}`));
    }
  }
});

module.exports = { buildUpload, screenshotUpload };
