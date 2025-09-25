# Infinity Gaming POS - Replit Setup

## Overview
A production-ready Point of Sale and analytics app for a gaming lounge, built with Next.js App Router, Supabase, Tailwind, and M-Pesa (Daraja) mobile payments. Successfully configured for the Replit environment.

## Project Architecture
- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS, shadcn/ui components
- **Database**: Supabase (Postgres with RLS)
- **Authentication**: Supabase Auth with middleware-protected routes
- **Payments**: M-Pesa STK Push (Daraja API)
- **State Management**: TanStack React Query
- **AI Features**: Google Genkit AI integration

## Replit Configuration
- **Port**: 5000 (configured for Replit proxy)
- **Host**: 0.0.0.0 (allows Replit iframe access)
- **Domain**: 1054cf8b-b5c5-477b-b86d-cba7f1167be8-00-3igtk5tecx9h0.riker.replit.dev
- **Workflow**: Frontend Server running `npm run dev`
- **Deployment**: Autoscale target with npm build/start

## Environment Variables Setup
Basic environment file created at `.env.local` with placeholders for:
- Supabase URL and anon key (needs user configuration)
- M-Pesa API credentials (sandbox mode)
- Public site URL (set to Replit domain)

## Recent Changes (Sept 25, 2025)
- Configured Next.js for Replit environment (port 5000, host 0.0.0.0)
- Added allowedDevOrigins for cross-origin requests
- Created development environment variables
- Set up Frontend Server workflow
- Configured autoscale deployment

## Next Steps for Users
1. Configure actual Supabase project credentials in environment variables
2. Set up M-Pesa Daraja API credentials for payment processing
3. Run database migrations in Supabase
4. Configure Supabase Auth URLs and CORS settings

## User Preferences
- Development environment configured with standard Next.js workflow
- Production deployment ready for Replit's autoscale hosting