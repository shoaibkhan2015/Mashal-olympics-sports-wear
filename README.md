# Mashal Olympics Sports Wear

Custom sportswear website — Next.js (App Router) + React + Tailwind CSS 4. Deploys on **Vercel** with zero config.

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Pages
`/` home · `/shop` collection · `/about` · `/contact` quote form (demo — nothing is sent anywhere yet).

## Project layout
```
src/app/          routes (page.tsx = /, shop/, about/, contact/), layout, error + 404 pages, globals.css
src/components/   header, footer, marquee, cylinder gallery, customize-design, reveal animation
src/lib/          catalog (product categories + images), utils
src/assets/       photos — replace with your own using the same file names (mashal-logo.jpg is a stand-in)
```
