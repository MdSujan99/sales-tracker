# Restaurant Daily Sales Snapshot
## Step-by-Step Deployment & Supabase Setup Guide

Follow this guide to connect your Supabase database and deploy the single React/Vite app to Vercel for free.

---

## Prerequisites

- [x] **GitHub Repository**: [`https://github.com/MdSujan99/sales-tracker`](https://github.com/MdSujan99/sales-tracker) (Already set up and pushed)
- [ ] **Supabase Account**: Free account at [supabase.com](https://supabase.com)
- [ ] **Vercel Account**: Free account at [vercel.com](https://vercel.com) (Sign in with your GitHub account)

---

## Part 1: Set Up Supabase Cloud Database (3–5 minutes)

### Step 1: Create a New Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **Sign In** or **Start your project**.
2. From your dashboard, click the green button **"New Project"**.
3. Fill in the project details:
   - **Organization**: Select your default organization (or create one).
   - **Name**: `sales-tracker` (or your restaurant name).
   - **Database Password**: Click *Generate a password* (copy and save this somewhere safe).
   - **Region**: Choose the region closest to your restaurant (e.g., `South Asia (Mumbai)` or `Southeast Asia (Singapore)` for lowest latency).
   - **Pricing Plan**: Free (included by default).
4. Click **"Create new project"**.
   > *Note: Supabase takes about 60–90 seconds to provision your PostgreSQL database.*

---

### Step 2: Execute the Database Schema
Once your project dashboard finishes provisioning:

1. Look at the left sidebar navigation and click on **SQL Editor** (the `>_` terminal icon).
2. Click the **"+ New query"** button at the top.
3. Open the file [`supabase/schema.sql`](./supabase/schema.sql) in this repository, select all contents (`Ctrl+A`), and copy them (`Ctrl+C`).
4. Paste the SQL code into the Supabase SQL Editor.
5. Click the green **"Run"** button in the bottom right corner (or press `Ctrl + Enter`).
6. You should see a message at the bottom: **`Success. No rows returned`**.

> **What this does:**
> - Creates `restaurants`, `daily_statements`, `cash_memos`, `expense_categories`, and `expense_entries` tables.
> - Configures Row-Level Security (RLS) policies.
> - Seeds the 12 standard paper statement expense categories (Vegetables, Meat, Dairy, Gas, Wages, Packaging, etc.).

---

### Step 3: Copy Your API Credentials
1. In the Supabase left sidebar, click **Project Settings** (the gear icon at the bottom left).
2. Click on **API** (or **Data API** in the settings menu).
3. Under the **Project API keys** and **Configuration** sections, find and copy these two values:
   - **Project URL**: (looks like `https://abcdefghijklm.supabase.co`)
   - **anon / public key**: (a long JWT string starting with `eyJhbGci...`)

---

### Step 4: (Optional) Test Locally on Your Machine
To verify the cloud sync works on your local dev server:

1. In your local project folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your actual keys:
   ```env
   VITE_SUPABASE_URL=https://abcdefghijklm.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173). Notice the top right badge now displays **"Cloud Synced"** in blue instead of "Local Storage".

---

## Part 2: Deploy to Vercel (1–2 minutes)

Deploying to Vercel ensures the app is permanently online, gets automated HTTPS, and re-deploys automatically every time you push code to GitHub.

### Step 1: Import Your GitHub Repository
1. Go to [https://vercel.com](https://vercel.com) and log in using **Continue with GitHub**.
2. From the Vercel Dashboard, click **"Add New..."** → **"Project"**.
3. Under **Import Git Repository**, locate `MdSujan99/sales-tracker` and click **"Import"**.

---

### Step 2: Configure Project & Add Environment Variables
1. **Project Name**: `sales-tracker` (or leave default).
2. **Framework Preset**: Should automatically show **Vite**.
3. **Root Directory**: `./` (leave default).
4. Click on the **"Environment Variables"** dropdown to expand it.
5. Add the following two variables (copied from Supabase in Part 1, Step 3):

   | Key | Value |
   | :--- | :--- |
   | `VITE_SUPABASE_URL` | `https://abcdefghijklm.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (your anon public key) |

6. Click **"Deploy"**.

---

### Step 3: Deployment Complete!
Vercel will build and deploy your React app in ~30–45 seconds. You will see celebratory confetti and receive your production URL:
```text
https://sales-tracker-<your-username>.vercel.app
```

---

## Part 3: Using the App Across Devices

### On the Accountant's Phone
1. Open the Vercel link in Chrome or Safari on your phone.
2. Verify the top header shows:
   - `Online` (green badge)
   - `Cloud Synced` (blue badge)
   - `Accountant` role selected
3. **Add to Home Screen (PWA style)**:
   - On **Android (Chrome)**: Tap the 3 dots menu → **"Add to Home screen"** or **"Install app"**.
   - On **iPhone (Safari)**: Tap the Share button (square with arrow) → **"Add to Home Screen"**.
4. Tap **"Daily Entry"**, enter today's sales and expenses, and tap **"Finalize Statement"**.

### On the Owner's Laptop
1. Open the same Vercel URL on a laptop or desktop.
2. In the top bar, click the **"Owner"** role button.
3. Open **"History"** or **"Print Snapshot"**:
   - The statement submitted from the phone is immediately visible!
4. Click **"Print / Save as PDF"** to print an A4 copy or save it as a digital record.
5. Check **"Dashboard"** to inspect sales growth, average daily volume, and expense ratios.

---

## Troubleshooting & FAQs

### The badge says "Local Storage" instead of "Cloud Synced"
- **Cause**: The environment variables `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are either missing or contain typos.
- **Fix**: In Vercel, go to **Settings** → **Environment Variables**, verify both names and values, and trigger a **Redeploy** from the Deployments tab.

### Can I use the app if internet connectivity is temporarily down?
- **Yes**. The app auto-saves all in-progress drafts to the browser's `localStorage`. As soon as connectivity returns, saving the statement will sync it to Supabase.

### How do I back up my data?
- In the **History** tab of the app, click **"Export CSV"** anytime to download a spreadsheet of all historical statements.
- You can also export raw data or SQL dumps directly from the Supabase dashboard under **Table Editor**.
