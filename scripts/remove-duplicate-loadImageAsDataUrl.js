#!/usr/bin/env node
/**
 * Entfernt doppelte Deklarationen von loadImageAsDataUrl und getPieceLocalized in src/App.tsx.
 * Behebt Build-Fehler: "The symbol loadImageAsDataUrl has already been declared" / "getPieceLocalized has already been declared".
 * Ausführung auf dem Server nach git pull, falls npm run build fehlschlägt:
 *   node scripts/remove-duplicate-loadImageAsDataUrl.js
 *   npm run build
 */

const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('App.tsx nicht gefunden:', appPath);
  process.exit(1);
}

let content = fs.readFileSync(appPath, 'utf8');
let changed = false;

// 1) Zweite und weitere Deklarationen von "const loadImageAsDataUrl" entfernen
const loadImageRegex = /const loadImageAsDataUrl\s*=\s*\([^)]*\)\s*:\s*Promise<string \| null>\s*=>/g;
let match;
const loadImageMatches = [];
while ((match = loadImageRegex.exec(content)) !== null) loadImageMatches.push(match.index);

if (loadImageMatches.length > 1) {
  // Ab der zweiten Deklaration: komplette Funktion bis zum Ende (nächstes ";") bzw. bis schließende Klammer + Semikolon
  let start = loadImageMatches[1];
  let i = content.indexOf('=>', start);
  i = content.indexOf('{', i);
  let depth = 1, end = i + 1;
  while (depth > 0 && end < content.length) {
    if (content[end] === '{') depth++; else if (content[end] === '}') depth--;
    end++;
  }
  while (end < content.length && ';\n '.includes(content[end])) end++;
  content = content.slice(0, start).replace(/\n{3,}/g, '\n\n') + content.slice(end).replace(/^\n{2,}/, '\n');
  changed = true;
  console.log('Zweite Deklaration loadImageAsDataUrl entfernt.');
}

// 2) Zweite und weitere Deklarationen von "const getPieceLocalized" (mit optionalem ForLang/WithLang) entfernen
const getPieceRegex = /const getPieceLocalized(?:ForLang|WithLang)?\s*=\s*\([^)]*\)\s*:\s*string\s*=>\s*\{/g;
const getPieceMatches = [];
while ((match = getPieceRegex.exec(content)) !== null) getPieceMatches.push({ index: match.index, name: match[0].substring(0, match[0].indexOf('=')).trim() });

// Nur Duplikate entfernen (gleicher Name mehrfach)
const byName = {};
getPieceMatches.forEach(m => {
  const name = m.name;
  if (!byName[name]) byName[name] = [];
  byName[name].push(m.index);
});

Object.keys(byName).forEach(name => {
  const indices = byName[name];
  if (indices.length <= 1) return;
  for (let k = 1; k < indices.length; k++) {
    const start = indices[k];
    const brace = content.indexOf('{', content.indexOf('=>', start));
    let depth = 1, end = brace + 1;
    while (depth > 0 && end < content.length) {
      if (content[end] === '{') depth++; else if (content[end] === '}') depth--;
      end++;
    }
    while (end < content.length && ';\n '.includes(content[end])) end++;
    content = content.slice(0, start).replace(/\n{3,}/g, '\n\n') + content.slice(end).replace(/^\n{2,}/, '\n');
    changed = true;
    console.log('Doppelte Deklaration', name, 'entfernt.');
  }
});

if (changed) {
  fs.writeFileSync(appPath, content);
  console.log('App.tsx wurde angepasst. Bitte erneut: npm run build');
} else {
  console.log('Keine doppelten Deklarationen gefunden – Build-Fehler hat ggf. andere Ursache.');
}
