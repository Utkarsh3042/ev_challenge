import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix tCommon, tVal, t, etc.
  content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*useTranslation\(/g, "const { t: $1 } = useTranslation(");
  // Re-fix destructuring if it accidentally became const { t: { t } }
  content = content.replace(/const\s+\{\s*t:\s*\{\s*t\s*\}\s*\}\s*=\s*useTranslation/g, "const { t } = useTranslation");
  
  // Fix React unused
  content = content.replace(/import\s+\*\s*as\s+React\s+from\s+['"]react['"];?/g, "");

  // Fix type imports
  content = content.replace(/import\s+\{\s*(RiderSubmitResponse|LucideIcon)\s*\}\s+from/g, "import type { $1 } from");

  // Fix Charts entry unused
  content = content.replace(/entry,\s*index/g, "_entry, index");

  // Fix Badge unused
  content = content.replace(/import\s+\{\s*Badge\s*\}\s+from\s+['"][^'"]+['"];?/g, "");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed 2: ${filePath}`);
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
