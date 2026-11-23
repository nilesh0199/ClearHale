import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Allowed hex colors strictly from the token system
const ALLOWED_HEX = new Set([
  // Neutral light palette
  '#ffffff', '#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626', '#171717', '#0a0a0a',
  // Neutral dark palette
  '#000000', '#373737', '#8a8a8a',
  // AQI Bands (Light & Dark)
  '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#881337',
  '#34d399', '#a3e635', '#fbbf24', '#fb923c', '#f87171', '#fb7185', '#fda4af',
  '#059669', '#0d9488', '#b45309', '#ea580c', '#7f1d1d',
  // Danger red
  '#dc2626', '#fef2f2',
  // Accent Teal
  '#0d5c52', '#09473f', '#eaf5f3', '#2dd4bf', '#14b8a6', '#16332e',
]);

const IGNORED_PATHS = [
  path.join(rootDir, 'lib', 'theme'),
  path.join(rootDir, 'test'),
  path.join(rootDir, 'scripts'),
  path.join(rootDir, '.next'),
  path.join(rootDir, 'node_modules'),
  path.join(rootDir, 'components', 'share', 'AirQualityCard.tsx'),
];

function getAllFiles(dir, exts = ['.tsx', '.ts', '.css']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (IGNORED_PATHS.some(ignored => fullPath.startsWith(ignored))) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  return results;
}

test('Design Token Enforcement: No unapproved raw hex colors', () => {
  const targetDirs = [
    path.join(rootDir, 'components'),
    path.join(rootDir, 'app'),
  ];

  const files = targetDirs.flatMap(d => getAllFiles(d));
  const violations = [];

  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineIdx) => {
      // Skip comments or token references
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

      let match;
      while ((match = hexRegex.exec(line)) !== null) {
        const hex = match[0].toLowerCase();
        // Normalize 3-digit hex to 6-digit
        const normalized = hex.length === 4
          ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
          : hex;

        if (!ALLOWED_HEX.has(normalized)) {
          violations.push({
            file: path.relative(rootDir, filePath),
            line: lineIdx + 1,
            hex: match[0],
            text: line.trim(),
          });
        }
      }
    });
  }

  if (violations.length > 0) {
    console.error('Found unapproved hex colors in components/app:');
    violations.forEach(v => console.error(`  ${v.file}:${v.line} -> ${v.hex} in "${v.text}"`));
  }

  assert.strictEqual(
    violations.length,
    0,
    `Found ${violations.length} unapproved raw hex colors outside the token system`
  );
});

test('Design Token Enforcement: Disallow raw off-theme Tailwind utilities', () => {
  const targetDirs = [path.join(rootDir, 'components')];
  const files = targetDirs.flatMap(d => getAllFiles(d, ['.tsx']));
  const violations = [];

  // Disallow non-neutral colors outside danger, teal, aqi, and neutral tokens
  const forbiddenClasses = /\b(bg|text|border)-(purple|pink|indigo|blue|yellow|violet|cyan|fuchsia)-[0-9]{2,3}\b/g;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineIdx) => {
      if (line.trim().startsWith('//')) return;
      let match;
      while ((match = forbiddenClasses.exec(line)) !== null) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: lineIdx + 1,
          cls: match[0],
        });
      }
    });
  }

  assert.strictEqual(
    violations.length,
    0,
    `Found forbidden off-theme Tailwind color classes: ${JSON.stringify(violations)}`
  );
});
