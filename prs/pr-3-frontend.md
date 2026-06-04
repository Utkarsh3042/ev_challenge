# PR #3 — Frontend (Next.js 14 Multilingual Mobile PWA + Admin Dashboard)

## 🎯 Goal
Build the complete **rider-facing** experience and **admin dashboard** in Next.js 14. After this PR, a rider can open the form on their Android phone, switch between English/Hindi/Kannada, fill all 6 sections, submit, and see their referral code + QR. The admin can log in and see live stats, the leaderboard, and hot lead lists.

## 📋 Scope
- Project scaffold (Next.js 14 App Router, TypeScript, Tailwind, next-intl)
- Multilingual form (6 sections, conditional EV/petrol sub-sections)
- Score lookup page
- Admin login + 5-tab dashboard
- Reusable UI components
- API client with typed wrappers
- PWA basics (manifest, service worker, install prompt)
- Lighthouse mobile score target: > 90

**OUT of scope**:
- Real Twilio integration (PR #4) — frontend just calls the existing endpoints
- Production deployment configs (PR #5)

## 🔗 Depends On
- **PR #1** ✅ — frontend scaffold, env templates
- **PR #2** ✅ — backend endpoints to consume

## 📁 Files to Create

```
frontend/
├── app/
│   ├── layout.tsx                          # Root layout (fonts, providers)
│   ├── globals.css                         # Tailwind base + custom styles
│   ├── not-found.tsx
│   ├── [lang]/
│   │   ├── layout.tsx                      # Locale provider, nav
│   │   ├── page.tsx                        # Landing + language picker
│   │   ├── form/
│   │   │   ├── page.tsx                    # Main questionnaire (6 sections)
│   │   │   └── success/
│   │   │       └── page.tsx                # Share screen with QR
│   │   └── score/
│   │       └── page.tsx                    # Phone → score lookup
│   └── admin/
│       ├── layout.tsx                      # Auth-gated shell
│       ├── login/
│       │   └── page.tsx
│       ├── page.tsx                        # Overview dashboard
│       ├── riders/
│       │   └── page.tsx                    # Rider list with filters
│       ├── leads/
│       │   └── page.tsx                    # Hot leads tabs
│       ├── leaderboard/
│       │   └── page.tsx                    # Top referrers
│       └── messages/
│           └── page.tsx                    # WhatsApp log (PR #4 will fill)
├── components/
│   ├── ui/                                 # Reusable primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── radio-group.tsx
│   │   ├── checkbox-group.tsx
│   │   ├── select.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── progress.tsx
│   │   ├── drawer.tsx
│   │   └── toast.tsx
│   ├── form/
│   │   ├── SectionA.tsx                    # Basic profile
│   │   ├── SectionB.tsx                    # Vehicle
│   │   ├── SectionC.tsx                    # Challenges (conditional)
│   │   ├── SectionD.tsx                    # Insurance
│   │   ├── SectionE.tsx                    # Openness to change
│   │   ├── SectionF.tsx                    # Referral
│   │   ├── FormContainer.tsx               # Orchestrates sections + state
│   │   ├── ProgressBar.tsx
│   │   ├── StickyNextButton.tsx
│   │   └── ReviewSubmit.tsx                # Final review step
│   ├── share/
│   │   ├── WhatsAppShareButton.tsx
│   │   ├── CopyLinkButton.tsx
│   │   ├── DownloadQRButton.tsx
│   │   └── ReferralDisplay.tsx
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── KPICard.tsx
│   │   ├── VehicleTypeChart.tsx
│   │   ├── CityChart.tsx
│   │   ├── SignupsLineChart.tsx
│   │   ├── PlatformChart.tsx
│   │   ├── RidersTable.tsx
│   │   ├── RiderDetailDrawer.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── SegmentsTabs.tsx
│   │   ├── ExportCSVButton.tsx
│   │   └── LoginForm.tsx
│   ├── landing/
│   │   ├── LanguagePicker.tsx
│   │   ├── HeroSection.tsx
│   │   ├── StatsBar.tsx                    # "1,247 riders registered"
│   │   └── HowItWorks.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorState.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
├── lib/
│   ├── api.ts                              # Typed API client (fetch wrapper)
│   ├── i18n-config.ts                      # next-intl config
│   ├── locales.ts                          # Available locales enum
│   ├── auth.ts                             # Cookie helpers for admin JWT
│   ├── form-state.ts                       # localStorage persistence
│   ├── constants.ts                        # Cities, platforms, etc.
│   ├── types.ts                            # Shared TS types matching backend
│   └── utils.ts                            # cn(), formatCurrency, etc.
├── hooks/
│   ├── useFormState.ts                     # Form state + localStorage sync
│   ├── useApi.ts                           # Generic async data hook
│   ├── useDebounce.ts
│   └── useMediaQuery.ts
├── messages/
│   ├── en.json                             # All English strings
│   ├── hi.json                             # All Hindi strings
│   └── kn.json                             # All Kannada strings
├── public/
│   ├── logo.svg
│   ├── logo-icon.png
│   ├── og-image.png
│   ├── manifest.json                       # PWA
│   ├── sw.js                               # Service worker (basic)
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── middleware.ts                           # next-intl locale detection
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
├── package.json
├── .eslintrc.json
├── .prettierrc
└── .env.local.example
```


## 🌍 Multilingual Strategy

**3 locales:** `en`, `hi`, `kn` (English, Hindi, Kannada)
**Routing:** `/[lang]/...` for all public pages
**Library:** `next-intl` (best App Router support)
**Detection order:**
1. URL prefix (`/hi/form` → Hindi)
2. `localStorage` saved preference
3. `navigator.language` (browser)
4. City-based heuristic: Bangalore → Kannada fallback
5. Default: English

**Switching languages:** A persistent globe icon in the nav swaps the URL prefix and saves to localStorage. No page reload flash.

**Translation file structure** (`messages/en.json` example):
```json
{
  "common": {
    "appName": "Road Warrior",
    "next": "Next",
    "back": "Back",
    "submit": "Submit",
    "loading": "Loading...",
    "error": "Something went wrong"
  },
  "landing": {
    "hero": "Join 1,200+ delivery riders going electric",
    "cta": "Start in 3 minutes",
    "pickLanguage": "Choose your language"
  },
  "form": {
    "sectionA": { "title": "Tell us about yourself", "fullName": "Full name", ... },
    "sectionB": { "title": "Your current vehicle", ... },
    "sectionC": { "title": "Your daily challenges", ... },
    ...
  },
  "success": {
    "title": "Welcome, {name}!",
    "yourCode": "Your referral code",
    "shareMessage": "Share this code with other riders..."
  },
  "score": {
    "title": "Check your points",
    "enterPhone": "Enter your phone number",
    "yourPoints": "You have {points} points"
  }
}
```

The same key tree is filled out for `hi.json` and `kn.json`.

## 📱 Rider-Facing Pages

### 1. Landing — `/[lang]`
- Hero with logo + tagline in chosen language
- Big "Start" button → `/[lang]/form`
- Language picker (3 large buttons)
- Live "X riders registered" stat (calls `/api/meta/stats/summary`)
- 3-step "How it works" explainer (with icons)
- Bottom CTA fixed bar

**Mobile-first design constraints:**
- Single column, no horizontal scroll
- Min tap target 48px
- Min font size 16px (no iOS zoom on input focus)
- High contrast, works in direct sunlight
- Total page weight < 150KB

### 2. Form — `/[lang]/form`
**Layout:**
- Sticky top: Progress bar (1/6 → 6/6)
- Sticky bottom: Large "Next" / "Back" buttons (thumb zone)
- Center: One section visible at a time
- All sections in same component tree (just hide/show) to preserve state

**Form state management:**
- Single React state object: `{ sectionA: {...}, sectionB: {...}, ... }`
- Auto-saved to `localStorage` every 5 seconds (and on field blur)
- Restored on page load (with "Resume previous?" prompt)
- `?ref=RW-XXXX` in URL → auto-fills Section F's referral code
- City select on first field → suggests language (`Bangalore` → `kn`)

**Sections (rendered in order):**

**Section A — Basic Profile**
- Full name (text, required)
- Phone (tel, required, with +91 prefix, validates 10 digits)
- City (select, 7 options)
- Platform (radio cards: Swiggy/Zomato/Blinkit/Porter/Dunzo/Other)
- Years of experience (number, 0-50)
- Language (select, 3 options, prefilled)

**Section B — Current Vehicle**
- Vehicle type (radio cards with icons: 🛵 Petrol / ⚙️ Diesel / ⚡ Electric / ❓ Other)
- Brand & model (text, optional, placeholder "e.g. Honda Activa")
- Fuel/charge method (radio cards)
- Weekly expense (number with ₹ prefix)
- Monthly maintenance (number with ₹ prefix)

**Section C — Challenges**
- General challenges (checkbox grid, max 3 selectable, shows counter)
- If `vehicle_type === 'electric'`: show EV sub-section (5 checkboxes)
- If `vehicle_type === 'petrol' or 'diesel'`: show petrol sub-section (5 checkboxes)
- "Other" option reveals a text field

**Section D — Insurance**
- Accidental insurance (3-button selector: Yes / No / Not sure)
- Health insurance (same)
- Paid out of pocket for accident (Yes/No)

**Section E — Openness to Change**
- Open to EV switch (4-button selector with icons: ✅ Yes / ❌ No / ⚡ Already EV / ❓ Need info)
- Switch motivators (checkbox grid, multi)
- Interested in (checkbox grid, multi)

**Section F — Referral**
- "Were you referred?" Yes/No
- If Yes → text input for referral code (with live validation via `/api/riders/validate-referral/{code}`)
- Shows "✅ Valid - will earn 5 points for [Ravi K.]" or "❌ Invalid code"

**Submit step:**
- Review screen showing all answers
- Edit links back to each section
- Big "Submit" button
- On click → loading state, then redirect to `/[lang]/form/success`

**Mobile UX details:**
- Swipe gestures for next/back (optional, with visible buttons as primary)
- Keyboard-aware: scrolls active field into view
- Number inputs use `inputmode="numeric"` and `pattern="[0-9]*"`
- Phone field auto-formats as user types

### 3. Success — `/[lang]/form/success`
- Big celebration animation (subtle, not annoying)
- "Welcome, {name}!" in chosen language
- Referral code in giant text with copy button
- QR code (256×256) generated client-side from `referral_code` + `share_url`
- Three share buttons:
  - **WhatsApp** (pre-filled message in their language)
  - **Copy Link** (with toast confirmation)
  - **Download QR** (PNG)
- "Your points: 10" small badge
- "Share with 10 riders to earn 100 bonus points!" progress hint

### 4. Score Lookup — `/[lang]/score`
- Single phone input
- Submit → loading → results card
- Results card shows:
  - Name
  - Points (big number)
  - Referral count
  - Leaderboard rank (e.g., "Top 5% in Bangalore")
  - Next milestone progress bar
  - Share button (links to share URL)
- "Rider not found" empty state with link to form

## 🛡️ Admin Dashboard

### Login — `/admin/login`
- Simple email + password form
- "Remember me" checkbox
- On success → redirect to `/admin`
- JWT stored in httpOnly cookie (set by backend)

### Shell — `/admin` layout
- **Sidebar** (collapsible on mobile):
  - Logo
  - Overview (📊)
  - Riders (👥)
  - Hot Leads (🔥)
  - Leaderboard (🏆)
  - Messages (💬) — populated in PR #4
  - Logout button at bottom
- **TopBar**:
  - Page title
  - Admin name
  - Quick search
- **Main content** area

### Overview Tab — `/admin`
**KPI cards (top row, 4 cards):**
- Total Riders
- Total Points Awarded
- Hot EV Leads (count)
- Active Referrers

**Charts (2×2 grid on desktop, stacked on mobile):**
- Vehicle type pie chart (Recharts)
- City bar chart
- Platform donut
- Signups line chart (last 30 days)

**Recent activity feed:**
- Last 10 signups with timestamp + city + vehicle type

### Riders Tab — `/admin/riders`
- **Filters bar** (sticky top):
  - Search (name/phone, debounced)
  - City multi-select
  - Vehicle type multi-select
  - Language multi-select
  - Date range picker
  - Segment multi-select (chips)
  - "Clear filters" button
- **Table** with columns:
  - Name, Phone, City, Platform, Vehicle, Points, Referrals, Segments (badges), Created
- **Pagination** (50 per page, with total count)
- **Row click** → opens **RiderDetailDrawer** (right-side slide-over)
  - All fields
  - Full referral chain (who referred them + who they referred)
  - WhatsApp messages sent to them
  - Manual "Send WhatsApp" button (admin tool)

### Hot Leads Tab — `/admin/leads`
- **Tabbed sub-views**:
  - Hot EV Leads (petrol/diesel + open_to_switch=yes)
  - Insurance Leads (no accident OR no health)
  - Retrofit Leads (interested in retrofit)
  - Accident Victims
  - High Spenders
- Each tab = same filterable table pattern as Riders
- "Export to CSV" button per tab

### Leaderboard Tab — `/admin/leaderboard`
- Top 50 referrers
- Columns: Rank, Name, City, Points, Referrals, Last Activity
- Top 3 get medal icons (🥇🥈🥉)
- Riders with milestones get a badge:
  - 🥉 Bronze (10)
  - 🥈 Silver (25)
  - 🥇 Gold (50, in lucky draw)
- City filter
- "View full leaderboard" → /admin/riders?sort=referral_count

### Messages Tab — `/admin/messages`
- (PR #3 stub: shows "WhatsApp integration coming in next release")
- PR #4 fills this with real data


## 🧩 Reusable UI Components

**Design system foundation:** Tailwind + a tiny set of headless primitives (no heavy lib like MUI to keep bundle small).

### `ui/button.tsx`
- Variants: `primary` (orange), `secondary` (navy), `ghost`, `outline`
- Sizes: `sm`, `md`, `lg`, `xl` (xl is for mobile CTA)
- States: default, hover, active, disabled, loading (spinner inside)
- Min height 48px on `lg`+

### `ui/input.tsx`
- Text, tel, number, email variants
- Floating label
- Error state with helper text
- `inputMode` auto-set based on type
- `₹` prefix slot for currency inputs

### `ui/radio-group.tsx`
- Used for single-choice questions
- Two layouts: inline (horizontal) and card (large tap targets with icons)
- Required state shows red border

### `ui/checkbox-group.tsx`
- Used for multi-select challenges
- Enforces max selections (e.g., top 3 challenges)
- Shows running counter "2/3 selected"
- Disables unchecked when max reached

### `ui/card.tsx`
- Used for section containers
- White bg, subtle shadow, rounded-xl
- Mobile: full-width, no margin

### `ui/badge.tsx`
- Segment tags (small colored pills)
- Color-coded by segment type (green for leads, blue for EV, red for accidents)

### `ui/progress.tsx`
- Linear progress for form completion
- Animated fill on change
- Used in: form top bar, score page milestones

### `ui/drawer.tsx`
- Right-side slide-over for rider details
- Backdrop blur
- Escape to close
- Mobile: full-screen sheet

### `ui/toast.tsx`
- Bottom-of-screen toast for confirmations
- Auto-dismiss 3s
- Variants: success, error, info

## 📚 Lib Utilities

### `lib/api.ts` (typed API client)
```ts
export const api = {
  submitRider: (data: RiderSubmit) =>
    fetch('/api/riders/submit', { method: 'POST', body: JSON.stringify(data) }),

  getScore: (phone: string) =>
    fetch(`/api/riders/score?phone=${encodeURIComponent(phone)}`),

  validateReferral: (code: string) =>
    fetch(`/api/riders/validate-referral/${code}`),

  getStats: () => fetch('/api/admin/stats'),
  // ... etc
}
```
- Returns parsed JSON or throws typed `ApiError`
- All endpoints have matching TS interfaces in `lib/types.ts`

### `lib/auth.ts`
- `getAdminToken()` — reads from cookie (server components)
- `requireAdmin()` — redirects to `/admin/login` if no token
- `logoutAdmin()` — calls backend logout + clears cookie

### `lib/form-state.ts`
- `saveFormState(state)` — writes to `localStorage` with timestamp
- `loadFormState()` — reads, returns null if > 24h old
- `clearFormState()` — on successful submit

### `lib/constants.ts`
- `CITIES`, `PLATFORMS`, `VEHICLE_TYPES`, `CHALLENGES`, `EV_CHALLENGES`, `PETROL_CHALLENGES`, `INSURANCE_OPTIONS`, `SWITCH_OPTIONS`, `MOTIVATORS`, `INTERESTS` — mirrors backend options

## 🎣 Custom Hooks

### `useFormState`
- Wraps form state with auto-save
- Returns `{ state, update, reset, isDirty }`

### `useApi`
- Generic data fetching with loading/error states
- Usage: `const { data, loading, error, refetch } = useApi(() => api.getStats())`

### `useDebounce`
- For search input → reduces API calls

### `useMediaQuery`
- For responsive sidebar collapse


## 🎨 Design System

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `primary-500` | `#FF6B1A` | Main CTAs, brand orange |
| `primary-600` | `#E55A0F` | Pressed states |
| `secondary-900` | `#0F1B2D` | Headers, text, dark navy |
| `secondary-500` | `#5A6B85` | Secondary text |
| `success-500` | `#10B981` | Confirmations, "Yes" answers |
| `warning-500` | `#F59E0B` | Milestone badges |
| `danger-500` | `#EF4444` | Errors, "No" answers |
| `bg-canvas` | `#F7F8FA` | App background |
| `bg-surface` | `#FFFFFF` | Cards |

### Typography
- Primary: **Inter** (Latin), **Noto Sans Devanagari** (Hindi), **Noto Sans Kannada** (Kannada)
- Loaded via `next/font/google` (zero CLS, optimized)
- Sizes: `text-sm` (14), `text-base` (16, body), `text-lg` (18), `text-xl` (20), `text-2xl` (24), `text-3xl` (30)

### Spacing
- 4px grid (Tailwind default)
- Section padding: `p-4` on mobile, `p-6` on tablet+
- Card gap: `gap-4`

### Breakpoints
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop — admin only)
- Mobile-first: base styles assume mobile, then `md:` and up

## 📦 Dependencies

### `package.json` core
```json
{
  "dependencies": {
    "next": "14.2.18",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "next-intl": "3.26.0",
    "qrcode": "1.5.4",
    "recharts": "2.13.3",
    "clsx": "2.1.1",
    "tailwind-merge": "2.5.4",
    "lucide-react": "0.460.0",
    "react-hook-form": "7.53.2",
    "zod": "3.23.8",
    "date-fns": "4.1.0"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "@types/node": "22.9.0",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "@types/qrcode": "1.5.5",
    "tailwindcss": "3.4.14",
    "postcss": "8.4.49",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.1",
    "eslint-config-next": "14.2.18",
    "prettier": "3.3.3",
    "prettier-plugin-tailwindcss": "0.6.8"
  }
}
```

## 📱 PWA Setup
- `public/manifest.json` with app name, icons, theme color
- `public/sw.js` minimal service worker (cache static assets, network-first for API)
- `app/layout.tsx` includes manifest link and theme-color meta
- Install prompt component (subtle, appears after first successful submit)

## ✅ Acceptance Criteria
- [ ] `npm run dev` starts Next.js on port 3000
- [ ] Visiting `http://localhost:3000` redirects to `/en`
- [ ] All 3 language buttons work, URL changes, content translates
- [ ] Form fills out in < 3 min on a real Android phone (test on Chrome DevTools mobile emulator)
- [ ] Progress bar updates correctly through 6 sections
- [ ] Conditional sub-section in Section C (EV vs petrol) shows/hides correctly
- [ ] Referral code validation shows ✅/❌ as user types
- [ ] Submitting form → success page shows referral code, QR, share buttons
- [ ] WhatsApp share button opens WhatsApp with pre-filled message in correct language
- [ ] Score page returns correct data for a known phone
- [ ] Form state persists across page refresh (close tab, reopen, still there)
- [ ] Admin login at `/admin/login` works with seeded creds
- [ ] Admin dashboard loads stats, charts, leaderboard with real data
- [ ] Riders table shows all 25 seeded riders, filters work
- [ ] Hot Leads tabs each show the correct count
- [ ] CSV export downloads a valid CSV
- [ ] Lighthouse mobile score > 90 on landing and form pages
- [ ] All 3 translation files have all keys (no missing translations)
- [ ] No console errors, no hydration warnings


## 📊 Estimated Effort
- **Size:** XL (Extra Large)
- **Files:** ~80 new
- **Lines:** ~5,000 LOC (lots of UI + i18n)
- **Translation keys:** ~200 per language = 600 strings total

## ⚠️ Risks & Notes
- **Kannada translations** must be done by a native speaker, not machine-translated. Will mark specific keys for review.
- **localStorage** has 5MB limit and is wiped in incognito — show clear UX for "session lost" case.
- **Recharts** is ~95KB gzipped — acceptable for admin only, not used on rider pages.
- **next-intl + App Router** had some sharp edges pre-3.20; pinning to `3.26.0` for stability.
- **Service worker** is intentionally minimal in this PR — full offline mode is PR #5 territory.
- **PWA install prompt** must use the deprecated `beforeinstallprompt` event correctly; test on real Android Chrome.

## 🔗 Related PRs
- **PR #1** ✅ — frontend scaffold provided
- **PR #2** ✅ — all endpoints ready
- **PR #4** — Messages tab becomes real
- **PR #5** — CI/CD, deployment, e2e tests, offline mode

---

**Reviewer focus areas:**
1. UI/UX flow — does the form feel < 3 min? Is the success page delightful enough to share?
2. Color palette and typography — appropriate for the EV/energy theme? Accessible (WCAG AA)?
3. Translation strategy — is the `next-intl` + URL prefix + localStorage combo the right call, or should we use cookie-based locale?
4. Admin dashboard scope — are all 5 tabs necessary, or can we ship fewer for MVP?
5. Component library choice — build our own UI primitives or pull in shadcn/ui (saves time, slightly bigger bundle)?
6. Form library — is `react-hook-form` + `zod` overkill, or the right call for a 6-section form?
