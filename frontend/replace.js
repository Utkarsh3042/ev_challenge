import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // i18n
  content = content.replace(/import\s+\{\s*useTranslations\s*\}\s+from\s+['"]next-intl['"];?/g, "import { useTranslation } from 'react-i18next';");
  content = content.replace(/import\s+\{\s*useLocale\s*\}\s+from\s+['"]next-intl['"];?/g, "import { useTranslation } from 'react-i18next';");
  content = content.replace(/const\s+t\s*=\s*useTranslations\(([^)]*)\);?/g, "const { t } = useTranslation($1);");
  content = content.replace(/const\s+locale\s*=\s*useLocale\(\);?/g, "const { i18n } = useTranslation(); const locale = i18n.language;");

  // next/link
  content = content.replace(/import\s+Link\s+from\s+['"]next\/link['"];?/g, "import { Link } from 'react-router-dom';");

  // next/navigation
  if (content.includes('next/navigation')) {
    let routerImports = [];
    if (content.includes('usePathname')) routerImports.push('useLocation');
    if (content.includes('useRouter')) routerImports.push('useNavigate');
    if (content.includes('useParams')) routerImports.push('useParams');
    if (content.includes('useSearchParams')) routerImports.push('useSearchParams');
    
    if (routerImports.length > 0) {
      content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]next\/navigation['"];?/g, `import { ${routerImports.join(', ')} } from 'react-router-dom';`);
    } else {
      content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]next\/navigation['"];?/g, '');
    }
  }

  // Hook usages
  content = content.replace(/const\s+pathname\s*=\s*usePathname\(\);?/g, "const location = useLocation(); const pathname = location.pathname;");
  content = content.replace(/const\s+router\s*=\s*useRouter\(\);?/g, "const navigate = useNavigate();");
  content = content.replace(/router\.push\(/g, "navigate(");

  // useSearchParams usages: Next.js useSearchParams returns a ReadonlyURLSearchParams which has .get()
  // React Router DOM useSearchParams returns [URLSearchParams, SetURLSearchParams].
  content = content.replace(/const\s+search\s*=\s*useSearchParams\(\);?/g, "const [search] = useSearchParams();");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
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

walk('./src/components');
walk('./src/lib');
walk('./src/pages');
