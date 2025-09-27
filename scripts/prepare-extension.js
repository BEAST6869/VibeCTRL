/* eslint-disable no-console */
// Copies CRA build into extension/, produces popup.html that loads the built assets
// Usage: node scripts/prepare-extension.js

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BUILD_DIR = path.join(ROOT, 'build');
const EXT_DIR = path.join(ROOT, 'extension');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function prepare() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('Build output not found. Run: npm run build');
    process.exit(1);
  }
  if (!fs.existsSync(EXT_DIR)) fs.mkdirSync(EXT_DIR, { recursive: true });

  // Copy build assets under extension/ (keep under same names)
  copyRecursive(path.join(BUILD_DIR, 'static'), path.join(EXT_DIR, 'static'));
  // Read build index.html and adjust asset paths to relative
  const indexHtml = fs.readFileSync(path.join(BUILD_DIR, 'index.html'), 'utf-8');
  // CRA index already contains relative paths to ./static in many setups; ensure no leading slashes
  const patched = indexHtml
    .replace(/href=\"\/(static\/[^"]+)\"/g, 'href="$1"')
    .replace(/src=\"\/(static\/[^"]+)\"/g, 'src="$1"')
    .replace(/<title>[^<]*<\/title>/, '<title>VibeCTRL</title>');

  fs.writeFileSync(path.join(EXT_DIR, 'popup.html'), patched, 'utf-8');
  console.log('✔ Extension popup prepared from CRA build');
}

prepare();
