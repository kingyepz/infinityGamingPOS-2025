## Infinity Gaming POS (Next.js + Supabase)

A production-ready Point of Sale and analytics app for a gaming lounge, built with Next.js App Router, Supabase, Tailwind, and M-Pesa (Daraja) mobile payments.

### Highlights
- **Auth & Sessions**: Supabase Auth with middleware-protected routes
- **Dashboard & CRUD**: Customers, sessions, stations, payments, loyalty points
- **Payments**: M-Pesa STK Push (Daraja), with callback handling and receipt flow
- **Theming & UI**: Tailwind + shadcn/ui components, dark mode
- **CI/Preview Friendly**: Dynamic rendering and resilient env handling for previews

---

## Tech Stack
- Next.js 15 (App Router), React 18, TypeScript
- Supabase (Auth, Postgres, RLS)
- Tailwind CSS, shadcn/ui
- React Query (TanStack Query)
- M-Pesa Daraja API (STK Push)

---

## Project Structure
```
src/
  app/
    (app)/                 # Protected application pages
    api/                   # Next.js API routes (M-Pesa)
    auth/                  # Public auth flows
  components/              # UI and layout
  hooks/                   # React hooks
  lib/
    supabase/              # Client and server helpers
    sql/                   # SQL migrations/utilities
    utils.ts               # Misc helpers
  middleware.ts            # Auth middleware
next.config.ts             # Next.js configuration
```

---

## Prerequisites
- Node.js 18+
- Supabase project (Database + Auth)
- Safaricom M-Pesa Daraja credentials (sandbox or production)

---

## Quick Start
1) Install dependencies
```bash
npm ci
```

2) Create `.env.local` at project root and set required variables
```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Public site URL for auth/reset links and payment callbacks
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# M-Pesa (Daraja)
MPESA_ENV=sandbox                      # sandbox | production
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_BUSINESS_SHORTCODE=...
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=http://localhost:3000
MPESA_CALLBACK_SECRET=some-shared-secret
```

3) Configure Supabase (DB + Auth)
- Run SQL migration(s) in Supabase SQL editor
```sql
-- File: src/lib/sql/add_mpesa_checkout_id.sql
alter table if exists public.sessions
add column if not exists mpesa_checkout_id text;

create or replace function public.check_mpesa_ref_exists(ref_code text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.sessions s
    where s.mpesa_reference is not null
      and upper(s.mpesa_reference) like '%' || upper(ref_code) || '%'
  );
$$;
```

- Auth → URL Configuration
  - Site URL: `NEXT_PUBLIC_SITE_URL`
  - Additional Redirect URLs: include your preview domains and `http://localhost:3000`
- Settings → API → CORS
  - Allowed origins: include `NEXT_PUBLIC_SITE_URL`, localhost, and any preview domains (ngrok/Cloudflare tunnel)

4) Run locally
```bash
npm run dev
```

5) Build & run production locally
```bash
npm run build
npm start
```

---

## Environment Variables (Reference)
- Supabase
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` (public base URL; used in password reset links, OAuth, and payment callbacks)
- M-Pesa (Daraja)
  - `MPESA_ENV` = `sandbox` or `production`
  - `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET`
  - `MPESA_BUSINESS_SHORTCODE` (PayBill/Till)
  - `MPESA_PASSKEY`
  - `MPESA_CALLBACK_URL` (base URL; defaults to `NEXT_PUBLIC_SITE_URL`)
  - `MPESA_CALLBACK_SECRET` (optional shared secret validated by callback route)

---

## Authentication & Routing
- `src/middleware.ts` guards the app routes; unauthenticated users are redirected to `/login`.
- Public routes: `/login`, `/signup`, `/forgot-password`, `/auth/update-password`.
- App routes live under `src/app/(app)/` and require auth.

---

## Payments: M-Pesa STK Push
### Flow
1) Cashier ends a session and selects M-Pesa Express (STK) in the dialog.
2) The app posts to `POST /api/stk-push` with amount, phone, and session id.
3) Server obtains Daraja token, generates password/timestamp, and calls STK Push.
4) On success, it stores `CheckoutRequestID` on the session for correlation.
5) Safaricom calls our `POST /api/mpesa-callback` endpoint when payment completes.
6) Callback validates secret (if configured), finds session by `mpesa_checkout_id`, and marks it `paid`, capturing the M-Pesa receipt.

### Split Payments
- Supported by initiating two STK pushes (one per payer) and tracking both.
- Current code wires single STK per session. To fully enable UI-driven split STK:
  - Add a `mpesa_payments` table (one row per payer) and track `checkout_id/status/ref`.
  - Send separate STK pushes for each payer; mark the session as paid when all are paid.
  - The UI can show two phone inputs and dual progress indicators.

### Sandbox vs Production
- Use `MPESA_ENV` to switch base URLs.
- Ensure your `MPESA_CALLBACK_URL`/`NEXT_PUBLIC_SITE_URL` is publicly reachable and whitelisted in Supabase CORS.

---

## Troubleshooting
- 404 on preview or redirect loops
  - Ensure `NEXT_PUBLIC_SITE_URL` is set to the exact preview URL.
  - Supabase Auth → URL Configuration and API → CORS must include your preview domain.
- “Failed to fetch” / Auth network errors
  - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in the runtime environment (not only local).
- STK Push errors
  - Verify Daraja credentials (consumer key/secret, shortcode, passkey) and that `MPESA_ENV=sandbox` for testing.
  - Confirm callback URL is publicly reachable and returns HTTP 200/JSON.
  - Check server logs for `M-Pesa STK Push error` or callback errors.
- Password reset not working
  - Supabase Auth → URL Configuration must include `NEXT_PUBLIC_SITE_URL` as Site URL and in Additional Redirect URLs.
  - The reset link should land on `/auth/update-password`.

---

## Deployment Notes
- Build: `npm run build`
- Runtime envs must include all `NEXT_PUBLIC_*` and `MPESA_*` variables.
- If using Firebase App Hosting, ensure rewrites proxy to Next server; if using Vercel/Netlify, standard Next deployments apply.
- For previews, consider a stable tunnel (ngrok with reserved subdomain or Cloudflare tunnel) and update the Supabase CORS/URLs accordingly.

---

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm start` – start production server
- `npm run typecheck` – TypeScript
- `npm run lint` – Next.js lint (during CI builds linting is disabled to avoid blocking)

---

## Security
- Do not commit secrets. Use environment variables in your hosting provider.
- `MPESA_CALLBACK_SECRET` helps ensure callbacks are from your configuration.
- Enforce Supabase RLS policies for all tables accessed by clients.

---

## License
This codebase is provided as-is for the Infinity Gaming Lounge POS use case. Adapt policies and flows to your operational needs.

# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
