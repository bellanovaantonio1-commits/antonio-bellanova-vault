/**
 * Removes duplicate keys from de, en, it in TRANSLATIONS in src/App.tsx.
 * Keeps first occurrence of each key per language. Run before build (e.g. prebuild).
 */
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');
const lines = content.split('\n');

// Find block boundaries: "  de: {", "  en: {", "  it: {" and their "  },"
const closes = [];
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t === '},') closes.push(i);
}
let idxDe = -1, idxEn = -1, idxIt = -1;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].trim();
  if (t === 'de: {') idxDe = i;
  if (t === 'en: {') idxEn = i;
  if (t === 'it: {') idxIt = i;
}
if (idxDe < 0 || idxEn < 0 || idxIt < 0 || closes.length < 3) {
  console.error('Could not find translation blocks in App.tsx');
  process.exit(1);
}
// First }, after de: { is end of de, etc.
const endDe = closes.find(c => c > idxDe) - 1;
const endEn = closes.find(c => c > idxEn) - 1;
const endIt = closes.find(c => c > idxIt) - 1;
const startDe = idxDe + 1;
const startEn = idxEn + 1;
const startIt = idxIt + 1;

function dedupeBlock(start, end) {
  const seen = new Set();
  const result = [];
  for (let i = start; i <= end; i++) {
    const line = lines[i];
    const m = line.match(/^\s*("([^"]+)"|[a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (!m) {
      result.push(line);
      continue;
    }
    const key = (m[2] || m[1]).replace(/^"|"$/g, '');
    if (seen.has(key)) continue; // skip duplicate
    seen.add(key);
    result.push(line);
  }
  return result;
}

const dedupedDe = dedupeBlock(startDe, endDe);
const dedupedEn = dedupeBlock(startEn, endEn);
const dedupedIt = dedupeBlock(startIt, endIt);

const out = [
  ...lines.slice(0, startDe),
  ...dedupedDe,
  lines[endDe + 1],
  ...lines.slice(endDe + 2, startEn),
  ...dedupedEn,
  lines[endEn + 1],
  ...lines.slice(endEn + 2, startIt),
  ...dedupedIt,
  lines[endIt + 1],
  ...lines.slice(endIt + 2)
].join('\n');

fs.writeFileSync(appPath, out);
console.log('Deduplicated translation keys in src/App.tsx');
