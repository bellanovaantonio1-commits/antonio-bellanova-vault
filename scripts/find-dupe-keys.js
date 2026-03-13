const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

// Translation blocks (0-based): de content 133-816, en 820-1475, it 1478-2081
const startDe = 133, endDe = 816;
const startEn = 820, endEn = 1475;
const startIt = 1478, endIt = 2081;

function getKeys(start, end) {
  const keys = [];
  for (let i = start; i <= end; i++) {
    const m = lines[i].match(/^\s*("([^"]+)"|[a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (m) keys.push({ lineNum: i + 1, key: m[2] || m[1], raw: lines[i] });
  }
  return keys;
}

function findDupes(keys) {
  const seen = new Map();
  const dupes = [];
  for (const k of keys) {
    if (seen.has(k.key)) dupes.push({ ...k, firstLine: seen.get(k.key) });
    else seen.set(k.key, k.lineNum);
  }
  return dupes;
}

const deKeys = getKeys(startDe, endDe);
const enKeys = getKeys(startEn, endEn);
const itKeys = getKeys(startIt, endIt);

const deDupes = findDupes(deKeys);
const enDupes = findDupes(enKeys);
const itDupes = findDupes(itKeys);

console.log('DE duplicate lines (to remove):', deDupes.length);
deDupes.forEach(d => console.log('  line', d.lineNum, d.key));
console.log('EN duplicate lines (to remove):', enDupes.length);
enDupes.forEach(d => console.log('  line', d.lineNum, d.key));
console.log('IT duplicate lines (to remove):', itDupes.length);
itDupes.forEach(d => console.log('  line', d.lineNum, d.key));

// Output line numbers to remove (second occurrence of each key)
const toRemove = new Set([
  ...deDupes.map(d => d.lineNum),
  ...enDupes.map(d => d.lineNum),
  ...itDupes.map(d => d.lineNum)
]);
fs.writeFileSync('scripts/dupe-line-numbers.json', JSON.stringify([...toRemove].sort((a,b)=>a-b)));
console.log('\nLines to remove written to scripts/dupe-line-numbers.json');
