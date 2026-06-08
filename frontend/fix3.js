import fs from 'fs';

// 1. Sidebar.tsx
let sidebar = fs.readFileSync('src/components/admin/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(/import \{ useLocation, useNavigate \} from 'react-router-dom';\n/g, "");
sidebar = "import { useLocation, useNavigate } from 'react-router-dom';\n" + sidebar;
fs.writeFileSync('src/components/admin/Sidebar.tsx', sidebar);

// 3. LanguageSwitcher.tsx
let ls = fs.readFileSync('src/components/common/LanguageSwitcher.tsx', 'utf8');
ls = ls.replace(/import\s+\{\s*useLocation,\s*useNavigate\s*\}\s*from\s*['"]react-router-dom['"];?/g, '');
ls = "import { useLocation, useNavigate } from 'react-router-dom';\n" + ls;
ls = ls.replace(/router\.replace/g, 'navigate');
ls = ls.replace(/router\.push/g, 'navigate');
fs.writeFileSync('src/components/common/LanguageSwitcher.tsx', ls);

// 4. React imports in ui/ components
const uiFiles = ['button.tsx', 'card.tsx', 'drawer.tsx', 'input.tsx', 'toast.tsx'];
uiFiles.forEach(f => {
  let p = 'src/components/ui/' + f;
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes("import * as React")) {
    c = "import * as React from 'react';\n" + c;
    fs.writeFileSync(p, c);
  }
});

// 5. Badge in admin pages
const adminPages = ['leaderboard/page.tsx', 'messages/page.tsx', 'riders/page.tsx'];
adminPages.forEach(f => {
  let p = 'src/pages/admin/' + f;
  let c = fs.readFileSync(p, 'utf8');
  if (!c.includes("import { Badge }")) {
    c = "import { Badge } from '../../../components/ui/badge';\n" + c;
    fs.writeFileSync(p, c);
  }
});
