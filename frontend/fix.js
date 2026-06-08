import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Link href -> to
  content = content.replace(/<Link([^>]*?)href=/g, '<Link$1to=');

  // useTranslations -> useTranslation
  content = content.replace(/useTranslations\(/g, "useTranslation(");
  // import useTranslation if it's missing but useTranslation( is there
  if (content.includes('useTranslation(') && !content.includes("import { useTranslation }")) {
      content = "import { useTranslation } from 'react-i18next';\n" + content;
  }

  // SuccessPage relative paths
  if (filePath.includes('SuccessPage')) {
      content = content.replace(/\.\.\/\.\.\/\.\.\/\.\.\//g, '@/');
  }

  // type imports
  content = content.replace(/import\s+\{\s*(LeaderboardEntry|RiderListItem|WhatsAppMessage|StatsResponse)\s*\}\s+from/g, "import type { $1 } from");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
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
