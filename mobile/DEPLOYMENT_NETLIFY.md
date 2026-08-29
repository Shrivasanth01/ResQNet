# Deploying ResQNet Mobile Web App to Netlify

This guide details how to host **only the Mobile Web App** on Netlify.

---

## Method 1: Netlify Web Dashboard (GitHub CI/CD - Recommended)

1. Go to 👉 **[app.netlify.com](https://app.netlify.com/)** and log in.
2. Click **"Add new site"** &rarr; **"Import an existing project"** &rarr; Select **GitHub** &rarr; Choose **`ResQNet`**.
3. Set the following build settings:
   - **Branch:** `feature/live-gps-status` (or `main`)
   - **Base directory:** `mobile`
   - **Build command:** `npx expo export --platform web`
   - **Publish directory:** `dist`
4. Click **"Deploy ResQNet"**!

---

## Method 2: Manual Terminal CLI Deploy

Run the following commands inside the `mobile` folder:

```powershell
cd "c:\work\Anitigravity\hackathon\disaster management\ResQNet\mobile"

# 1. Build the static web app
npx expo export --platform web

# 2. Deploy the dist directory directly to Netlify
npx --yes netlify-cli deploy --prod --dir=dist
```
