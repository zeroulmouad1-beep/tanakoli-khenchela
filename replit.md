# Tanakoli Khenchela — تنقلي خنشلة

Urban transit tracking app for Khenchela, Algeria. Built with Next.js 16, Firebase Firestore, Tailwind CSS v4, shadcn/ui, and Framer Motion.

## Architecture

### Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack dev)
- **Database**: Firebase Firestore (single hardcoded user doc `"0775453629"`)
- **UI**: shadcn/ui components (New York style) + Tailwind CSS v4
- **Icons**: lucide-react
- **Animations**: Framer Motion
- **Language**: TypeScript, Arabic RTL layout

### Dev Server
- Runs on port **5000** via `npm run dev`
- Command: `next dev -p 5000 -H 0.0.0.0`

---

## Auth System

Authentication is **mock/localStorage-based** for now. Real Firebase Phone Auth (SMS) is fully implemented in the codebase but commented out, ready to enable when needed.

### Mock OTP
Fixed code: **`123456`** — works for any phone number.

### Flow
1. User opens any route → `AuthGuard` checks localStorage session
2. No session → redirect to `/login`
3. `/login`: enter name + phone → simulated 800ms delay → 6-digit code step
4. User enters `123456` → `login()` saves session to localStorage → redirect to `/`
5. Logout: clears `tanoukli_session`, `tanoukli_user_cache`, `tanoukli_driver_mode`

### Re-enabling Real Firebase SMS
Everything needed is already in `app/login/page.tsx` as commented-out blocks:
1. Uncomment the Firebase auth imports at the top
2. Uncomment `getFirebaseErrorMessage()`
3. Replace the mock `sendSms()` with the real implementation (commented block below it)
4. Replace mock `handleVerify()` with the real `confirmationResult.confirm()` call
5. In `lib/auth-context.tsx`: swap the `useEffect` for `onAuthStateChanged(auth, ...)` (commented at top)

### Key Files
| File | Role |
|------|------|
| `lib/firebase.ts` | Firestore + Firebase Auth (`auth`) exports |
| `lib/auth-context.tsx` | `AuthProvider` — wraps `onAuthStateChanged`, exposes `login` / `logout` / `session` |
| `components/auth-guard.tsx` | Client component in root layout; redirects unauthenticated users to `/login` |
| `app/login/page.tsx` | Login page — real SMS via `signInWithPhoneNumber` + invisible reCAPTCHA |
| `app/layout.tsx` | Wraps everything in `AuthProvider` → `AuthGuard` |

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — map + search + stations list |
| `/login` | Login/register (public, unprotected) |
| `/account` | Full account management — edit profile, top-up balance, logout |
| `/profile` | Profile overview — user info, quick links |
| `/settings` | App settings — notifications, theme, language |
| `/trips` | Trip history + route schedules |
| `/stations` | Nearby stations map |
| `/help` | FAQ + support |
| `/about` | App info |

---

## Component Structure

```
app/           — Next.js App Router pages
components/    — Shared UI components
  ui/          — shadcn/ui primitives (57 components)
  app-wrapper.tsx   — Splash screen logic (only on home page)
  auth-guard.tsx    — Route protection
  bottom-nav.tsx    — Mobile bottom navigation
  app-header.tsx    — Top header with hamburger menu
lib/
  auth-context.tsx  — Auth state (localStorage session)
  firebase.ts       — Firestore client
  theme-context.tsx — Dark/light mode
  driver-mode-context.tsx — Driver vs passenger mode
  tracking-context.tsx    — Active route tracking
  bus-simulation.tsx      — Bus position simulation
hooks/
  use-user-cache.ts       — Firestore user data with localStorage cache
  use-trips-cache.ts      — Trips data cache
  use-routes.ts           — Route data
```

---

## Notes
- The `components/​ui/` folder (with zero-width space) is a legacy artifact from Vercel migration — ignore it. The active components are in `components/ui/`.
- The app has a single hardcoded Firestore user document (`"0775453629"`). All users log in with any name/phone and the same verification code.
- Firebase config keys are intentionally public (standard Firebase web client pattern).

---

## Agent Preferences

- **Git commits & pushes**: Only commit and push to GitHub when the user explicitly requests it. All other work should update local files only — no automatic commits.
