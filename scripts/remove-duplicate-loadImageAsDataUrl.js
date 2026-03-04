#!/usr/bin/env node
/**
 * Entfernt die zweite (duplizierte) Deklaration von loadImageAsDataUrl aus src/App.tsx.
 * Ausführung auf dem Server: node scripts/remove-duplicate-loadImageAsDataUrl.js
 * Oder aus Projektroot: node scripts/remove-duplicate-loadImageAsDataUrl.js
 */

const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

const firstDecl = content.indexOf('const loadImageAsDataUrl');
if (firstDecl === -1) {
  console.log('Keine loadImageAsDataUrl gefunden. Nichts zu tun.');
  process.exit(0);
}

const secondDecl = content.indexOf('const loadImageAsDataUrl', firstDecl + 1);
if (secondDecl === -1) {
  console.log('Nur eine Deklaration gefunden. Kein Duplikat.');
  process.exit(0);
}

// Find end of second function: arrow function with => { ... };
// Match from "const loadImageAsDataUrl" to the closing "});" of the Promise (with balanced braces)
let depth = 0;
let start = secondDecl;
let i = content.indexOf('=>', secondDecl);
if (i === -1) {
  console.error('Konnte Ende der Funktion nicht finden.');
  process.exit(1);
}
i = content.indexOf('{', i);
if (i === -1) {
  console.error('Konnte Öffnung der Funktion nicht finden.');
  process.exit(1);
}
depth = 1;
let end = i + 1;
while (depth > 0 && end < content.length) {
  const c = content[end];
  if (c === '{') depth++;
  else if (c === '}') depth--;
  end++;
}
// Include the closing ); for the Promise and any trailing newline
while (end < content.length && (content[end] === ')' || content[end] === ';' || content[end] === ' ' || content[end] === '\n')) end++;

const before = content.slice(0, start).replace(/\n{3,}/g, '\n\n');
const after = content.slice(end).replace(/^\n{2,}/, '\n');
content = before + after;

fs.writeFileSync(appPath, content, 'utf8');
console.log('Zweite Deklaration von loadImageAsDataUrl entfernt.');
