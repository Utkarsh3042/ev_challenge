import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Find all useTranslation('...') or useTranslation("...") calls
  content = content.replace(/useTranslation\(['"]([^'"]+)['"]\)/g, (match, key) => {
    if (key.includes('.')) {
      const parts = key.split('.');
      const ns = parts[0];
      const prefix = parts.slice(1).join('.');
      return `useTranslation('${ns}', { keyPrefix: '${prefix}' })`;
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed i18n: ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk('./src');
