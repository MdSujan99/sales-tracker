# Restaurant Daily Sales Snapshot Web App

A clean, mobile-first web application designed to replace the restaurant accountant's handwritten **Daily Cash Statement**.

Built as a single React/Vite application with Supabase (PostgreSQL + Auth + Row Level Security), eliminating the need for a separate backend server, cold starts, and complex dual deployments.

---

## Features

- **Mobile-First Daily Entry**: Fast, touch-friendly interface for phones and laptops to record cash sales, UPI, card, delivery platforms (Zomato/Swiggy), cash memo ranges, and itemized expenses.
- **Integer Paise Precision**: All financial calculations are executed using integer paise (1 INR = 100 paise) to eliminate floating-point discrepancies.
- **Live Reconciliation & Validation**: Real-time balancing checks between entered totals and itemized sums, warning banners, and memo range verification.
- **A4 Print / Save as PDF**: Direct browser print styling matching the physical restaurant daily cash statement layout with manager & accountant signature blocks.
- **Multi-Device Cloud Sync**: Real-time shared access between accountant's phone and owner's laptop via Supabase PostgreSQL and Row-Level Security (RLS).
- **Offline / Local Storage Fallback**: Fully functional even when offline or unconfigured, auto-saving drafts and preserving history locally.
- **Analytics & History**: Interactive sales trend charts, expense category distribution, average daily sales, and operational expense ratio.
- **One-Click Expense Duplication**: Copy yesterday's expense category structure to today's statement to accelerate morning entries.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser or phone on the same network.

### 3. Run Unit Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## Supabase Setup (Optional for Cloud Sync)

The application works out of the box using browser `localStorage`. To enable multi-device synchronization between the accountant's phone and the owner's laptop:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run the script in [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Set your Supabase credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
5. Restart your dev server (`npm run dev`). The status badge in the top bar will automatically switch to **Cloud Synced**.

---

## Deployment

Deploy with 1 click to any static hosting provider (Vercel, Cloudflare Pages, Netlify, or GitHub Pages):

### Vercel / Netlify
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the hosting dashboard.
