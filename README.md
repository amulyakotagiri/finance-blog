# Money Sense — Personal Finance Blog

A production-oriented personal finance education website focused on clarity for students and young adults.

**Design goal:** Trustworthy, modern, human editorial feel — not a generic AI/SaaS landing page.

## Features implemented (V1)

### Blog
- Homepage with clear hierarchy
- Article listing (`/blog`)
- Individual article pages with:
  - Author, published date, reading time
  - Category
  - Sources/references section
  - Educational disclaimer
  - Clean typography for long-form reading
- Placeholder articles (replace via CMS)

### Finance tools (`/tools`)
- Budget calculator (50/30/20 + custom %)
- Savings goal calculator (compound interest)
- Input validation + explicit assumptions
- Automated unit tests (`npm run test:calculators`)
- No personal data stored

### SEO
- Semantic HTML, unique titles & meta descriptions
- Open Graph tags
- `robots.txt` + XML sitemap
- Canonical-ready (via metadataBase)
- Article structured data ready (expand with JSON-LD)
- Clean URLs

### Security
- Security headers (X-Frame-Options, CSP, nosniff, etc.)
- Admin area structure prepared (NextAuth + Prisma)
- Password hashing (bcrypt) ready
- Input validation with Zod on calculators
- Environment variables for secrets
- No hardcoded credentials

### Legal
- Financial disclaimer
- Privacy policy
- Terms of use
- Clear educational-only messaging throughout

### Design & UX
- Mobile-first responsive layout
- Strong typography (Inter + Source Serif 4)
- Forest-green accent (trustworthy, not purple-gradient AI look)
- Excellent reading experience
- Accessible focus states and form labels
- Minimal animation, no glassmorphism

### Performance foundations
- Next.js App Router (SSR/SSG)
- Optimized fonts with `display: swap`
- Image format preferences (AVIF/WebP)
- Minimal client JS (calculators only)

## Tech stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma + PostgreSQL** (schema ready)
- **NextAuth** (admin auth ready)
- Pure functions for calculators + automated tests

## Getting started

### 1. Install dependencies

```bash
cd finance-blog
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/finance_blog"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-long-random-string"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 3. Database (optional for static placeholders)

```bash
npx prisma generate
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

### 5. Test calculators

```bash
npm run test:calculators
```

## Project structure

```
src/
  app/                 # Routes (App Router)
    blog/              # Listing + [slug]
    tools/             # Calculators
    legal/             # Disclaimer, privacy, terms
    about/
  components/
    layout/            # Header, Footer
    tools/             # Budget + Savings calculators
  lib/
    calculators/       # Pure calculation functions
    prisma.ts
    utils.ts
prisma/
  schema.prisma        # Full CMS data model
```

## CMS / Admin (next steps)

The Prisma schema includes:

- Users (ADMIN / AUTHOR roles)
- Articles (DRAFT → PREVIEW → PUBLISHED)
- Categories, Tags, Sources
- SEO fields (metaTitle, metaDescription)
- Featured flag, reading time, featured image

To complete the admin:

1. Add NextAuth credentials provider with bcrypt
2. Protect `/admin/*` routes with session checks
3. Build simple forms for create/edit article (title, slug, MDX content, status)
4. Optional: MDX rendering with `next-mdx-remote` for rich content

## Deployment

Recommended: **Vercel** + **Neon** (or Supabase) PostgreSQL.

1. Push repo to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy

Enable HTTPS (automatic on Vercel). Add a CDN for static assets if traffic grows.

## Scalability notes

- Static generation for published articles works well for traffic spikes
- Use CDN (Vercel Edge / Cloudflare)
- Connection pooling (Prisma + PgBouncer) for database
- Rate-limit admin and any write APIs
- Target of 10k concurrent users requires load testing on the chosen host — do not claim it is achieved without testing

## What is intentionally left for V1.1+

- Full admin UI (schema + auth ready)
- Real MDX content pipeline
- Image upload
- Search (simple full-text or Algolia)
- Plausible/privacy analytics
- Automated backups + monitoring
- Load testing results

## Design principles followed

- No purple/blue gradients, glassmorphism, or glowing UI
- No fake testimonials or statistics
- No generic card grids or excessive animation
- Human editorial typography and whitespace
- Clear financial disclaimers and assumptions

## License

Private / all rights reserved unless otherwise stated.
