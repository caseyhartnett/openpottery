# OpenPottery Deployment and Template Tool Integration

This document covers:

1. Deploying this site to Cloudflare Pages from GitHub
2. Enabling automatic deploys on every update
3. Integrating the `PolyGoneWild` template tool repo

---

## 1. Deploy OpenPottery to Cloudflare Pages

### Prerequisites

- Domain is in your Cloudflare account (you already have this)
- This repo is on GitHub (you already did this)
- You can push changes to the repo's production branch (`main` or `master`)

### Steps

1. In Cloudflare Dashboard, go to **Workers & Pages**.
2. Click **Create** -> **Pages** -> **Connect to Git**.
3. Authorize Cloudflare to access your GitHub account/repo if prompted.
4. Select your OpenPottery repo.
5. Configure build:
   - **Framework preset:** `None`
   - **Build command:** leave empty
   - **Build output directory:** `/` (root)
   - **Root directory:** leave empty
6. Choose production branch:
   - Use your real default branch (`main` or `master`)
7. Click **Save and Deploy**.

Because this is a static HTML/CSS/JS site, no build step is required.

---

## 2. Connect Your Cloudflare Domain

After first deploy succeeds:

1. Open your Pages project -> **Custom domains**.
2. Add `openpottery.com`.
3. Add `www.openpottery.com` (recommended).
4. Set your preferred primary domain:
   - Option A: primary `openpottery.com`
   - Option B: primary `www.openpottery.com`
5. Enable HTTPS (Cloudflare usually does this automatically for Pages custom domains).

If your domain is already on Cloudflare DNS, records are typically created for you.

---

## 3. Automatic Deploys From GitHub

Cloudflare Pages auto-deploys on pushes to the configured production branch.

Typical update flow:

```bash
git add .
git commit -m "Update content"
git push origin master
```

If your production branch is `main`, use:

```bash
git push origin main
```

Optional best practices:

- Use pull requests for preview deployments before merging
- Keep production changes on one branch to avoid confusion

---

## 4. Integrating `PolyGoneWild` Template Tool

You have two solid options. Recommended: **Option 1**.

## Option 1 (Recommended): Deploy `PolyGoneWild` separately and link it

This keeps both repos independent and clean.

### Steps

1. Create a second Cloudflare Pages project for the `PolyGoneWild` repo.
2. Configure its build settings based on that repo:
   - Example (Vite): build command `npm run build`, output `dist`
   - Example (Next): use Cloudflare Next preset or adapter workflow
3. Give it a subdomain such as `tool.openpottery.com`.
4. In this repo, update `tool.html` to:
   - add a prominent "Open Template Tool" button linking to `https://tool.openpottery.com`
   - optionally embed with an `<iframe>` if desired

Example link snippet:

```html
<p><a class="card-link" href="https://tool.openpottery.com">Open Template Tool</a></p>
```

Pros:

- Automatic deploys for both repos independently
- Cleaner rollback and debugging
- No cross-repo copy step

## Option 2: Serve tool inside this repo under a path

Use this if you want `openpottery.com/tool/` to host the built app directly.

### Steps

1. Build `PolyGoneWild` and output static assets.
2. Copy its build output into this repo, for example:
   - `template-tool/` (contains `index.html`, JS, CSS, assets)
3. Link to that path from `tool.html` or route directly to `/template-tool/`.
4. Commit and push this repo so Cloudflare Pages deploys the updated files.

Example local sync flow (if both repos are side-by-side on your machine):

```bash
# 1) Build PolyGoneWild
cd ../PolyGoneWild
npm ci
npm run build

# 2) Copy built static files into OpenPottery
rm -rf ../openpottery/template-tool
mkdir -p ../openpottery/template-tool
cp -R dist/* ../openpottery/template-tool/

# 3) Commit and push OpenPottery so Cloudflare deploys
cd ../openpottery
git add template-tool
git commit -m "Update template tool build from PolyGoneWild"
git push origin master
```

If your production branch is `main`, replace the last push command with:

```bash
git push origin main
```

Important:

- You need to repeat the copy whenever `PolyGoneWild` changes
- This can be automated with GitHub Actions later

---

## 5. Suggested Structure for Option 1

- Main site: `https://openpottery.com`
- Tool app: `https://tool.openpottery.com`
- From main site:
  - `tool.html` explains the tool and links to the app
  - Keep docs/help/FAQ on the main site

This is usually the fastest and least fragile setup.

---

## 6. First Troubleshooting Checks

If deployment fails:

1. Confirm Cloudflare project points to correct branch (`main` vs `master`)
2. Confirm build settings are correct for repo type (static vs framework)
3. Confirm no broken path assumptions (absolute `/assets/...` paths can fail if hosted under subpaths)
4. Check Pages deployment logs in Cloudflare Dashboard

If domain is not resolving:

1. Confirm custom domain is attached to the correct Pages project
2. Confirm DNS records were created in Cloudflare
3. Wait for DNS propagation and recheck
