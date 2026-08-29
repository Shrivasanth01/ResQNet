# ResQNet Dashboard - Netlify Deployment Guide

This guide walks you through deploying the **ResQNet Disaster Command Center (Next.js 15)** to **Netlify**.

---

## Method 1: Deploy via Netlify Web UI (Recommended)

This method connects your GitHub repository to Netlify for automated CI/CD deployments whenever you push new changes.

### Step 1: Push Changes to GitHub
Make sure your latest changes and the new `netlify.toml` file are pushed to GitHub:
```bash
git add .
git commit -m "feat: add netlify deployment configuration"
git push
```

### Step 2: Import Project in Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** -> **"Import an existing project"**.
3. Choose **GitHub** and select your `ResQNet` repository.

### Step 3: Configure Build Settings
Netlify will automatically detect the settings from `netlify.toml`. Verify the following:
- **Base directory:** `dashboard`
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Framework:** `Next.js`

### Step 4: Add Environment Variables (Optional)
In Netlify Site Settings -> **Environment variables**, add any needed variables:
| Variable Name | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Live Backend API URL | `https://api.your-resqnet-server.com/api/v1` (or leaves fallback to simulation) |
| `NEXT_PUBLIC_WS_URL` | Live WebSocket endpoint | `wss://api.your-resqnet-server.com/api/v1/ws/incidents` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini AI Key | `AIzaSy...` (for AI incident triage & summaries) |

### Step 5: Deploy
Click **"Deploy site"**. Netlify will build and deploy your live dashboard at a `https://<site-name>.netlify.app` URL.

---

## Method 2: Instant Deploy via Netlify CLI (Terminal)

You can also deploy directly from your local terminal using the Netlify CLI without linking GitHub.

### Step 1: Run Netlify Login
From the `dashboard` directory:
```bash
cd "c:\work\Anitigravity\hackathon\disaster management\ResQNet\dashboard"
npx --yes netlify-cli login
```
This opens your browser to authenticate with your Netlify account.

### Step 2: Initialize & Link Site
```bash
npx --yes netlify-cli init
```
- Select: **"Create & configure a new site"**
- Select your Netlify team
- Choose a site name (e.g. `resqnet-command-center`)

### Step 3: Deploy to Production
```bash
npx --yes netlify-cli deploy --prod
```
When prompted:
- **Publish directory:** `.next` (or press Enter if loaded from `netlify.toml`)

Your live production URL will be displayed in the terminal upon completion!
