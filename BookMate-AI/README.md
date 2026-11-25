# BookMate AI — NCTB Edition

Offline-first educational website for Bangladesh students (Class 1–12).
Ultra Glass UI · NCTB book catalog · PDF reader · Local AI assistant · IndexedDB uploads · Service Worker offline support.

## Tech Stack

- HTML5, CSS3, JavaScript (ES Modules)
- Vite
- PDF.js
- IndexedDB
- Service Worker
- Optional Transformers.js (browser local AI)
- Static deploy on Vercel
- Book catalog & PDFs hosted on GitHub

## Project Structure

```
BookMate-AI/
├── public/
│   ├── books/
│   │   ├── class-1/ … class-12/
│   └── data/
│       └── curriculum.json
├── src/
│   ├── main.js
│   ├── style.css
│   ├── book-reader.js
│   ├── ai-assistant.js
│   └── curriculum.js
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

## 1. Install Node.js

Download and install the LTS version from:
https://nodejs.org/

Verify:

```bash
node -v
npm -v
```

## 2. Install Dependencies

```bash
cd BookMate-AI
npm install
```

## 3. Run Locally

```bash
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## 4. Add Books to GitHub

1. Create a public GitHub repository (or use this project repo).
2. Place PDF files under:

   ```
   public/books/class-1/
   public/books/class-2/
   …
   public/books/class-12/
   ```

   Example: `public/books/class-9/physics.pdf`

3. Commit and push.

Because this is a static site, the browser loads books via relative paths (or GitHub raw URLs if you host the `public` folder as the site root).

## 5. Edit curriculum.json

File: `public/data/curriculum.json`

Format:

```json
{
  "version": "1.0.1",
  "currentYear": 2026,
  "lastChecked": "2026-11-25",
  "classes": [
    {
      "class": 9,
      "subjects": [
        {
          "id": "class-9-physics",
          "name": "Physics",
          "nameBn": "পদার্থবিজ্ঞান",
          "language": "bn",
          "year": 2026,
          "file": "/books/class-9/physics.pdf",
          "status": "official"
        }
      ]
    }
  ]
}
```

- Bump `version` when you change the catalog.
- Keep older year records if needed.
- All sample entries are labelled `"status": "example"`. Replace them with real PDFs and set status appropriately.
- Missing PDFs show a friendly empty state — no fake data is invented.

### Admin UI workflow

1. Open the **Admin** view in the app.
2. Add / edit entries locally.
3. Click **Download curriculum.json**.
4. Commit the downloaded file to your GitHub repository.
5. Redeploy (or let Vercel auto-deploy from the repo).

The frontend never writes to GitHub and never contains personal access tokens.

## 6. Deploy to Vercel

1. Push the project to a GitHub repository.
2. Go to https://vercel.com → **New Project** → Import the repo.
3. Framework Preset: **Vite** (or leave auto-detect).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy.

Commands used:

```bash
npm install
npm run build
```

`vercel.json` is already configured for SPA-style routing and caching headers.

## 7. Update the Website

1. Edit source or `curriculum.json`.
2. Commit & push to the connected GitHub branch.
3. Vercel rebuilds automatically.
4. Or run locally:

   ```bash
   npm run build
   npm run preview
   ```

## 8. Offline Reading

- A Service Worker caches the app shell and `curriculum.json`.
- User-uploaded books live in **IndexedDB** on the device.
- Previously opened NCTB books that were cached by the browser remain available offline.
- New GitHub books and curriculum version checks require an internet connection.
- An offline banner appears when the network is unavailable.

## Features Summary

| Feature | Status |
|---------|--------|
| Ultra Glass UI (light/dark) | ✅ |
| Class 1–12 NCTB catalog from JSON | ✅ |
| Dynamic catalog (no hard-coded books) | ✅ |
| Friendly empty state for missing PDFs | ✅ |
| Custom PDF/TXT upload → IndexedDB | ✅ |
| Full PDF reader (zoom, pages, search, bookmarks) | ✅ |
| AI Assistant with honest search fallback | ✅ |
| Optional browser local model (Transformers.js) | ✅ |
| Curriculum update checker | ✅ |
| Admin catalog editor + JSON download | ✅ |
| Service Worker offline support | ✅ |
| বাংলা / English language switcher | ✅ |
| Mobile-first + bottom navigation | ✅ |

## Security Notes

- Uploaded files are validated (type + size ≤ 50 MB).
- User text is escaped before rendering.
- No API keys or GitHub tokens in frontend code.
- Private uploaded content is never sent to external AI services without explicit user action (local model only).

## Quality Checklist

- All navigation links work.
- Buttons perform their stated actions.
- No fake generative AI responses.
- No invented NCTB book data.
- Missing PDFs handled gracefully.
- Production build: `npm run build`.

---

**BookMate AI — NCTB Edition** · Built for Bangladeshi students · Offline-first · Privacy-respecting
