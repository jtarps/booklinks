# BookLinks

Discover every book referenced inside your favorite reads. Search any title and uncover its hidden reading list — the books that authors cited, recommended, or built upon.

**Live at [booklinks.co](https://booklinks.co)**

## Features

- **Book Search** — Search by title or author across our database and Google Books
- **Reference Discovery** — AI-powered detection of books referenced within other books
- **Interactive Reference Map** — D3.js force-directed graph visualizing how books connect (`/explore`)
- **Reading Lists** — Create public or private lists, add books, and share with others
- **Social Features** — Upvote references, comment on connections, and follow other readers
- **Geo-Aware Affiliate Links** — Amazon purchase links automatically localized to 8 regions
- **Analytics Dashboard** — Stats on most referenced books, daily growth, and connection graphs
- **Feedback System** — Built-in bug reports and feature requests with admin dashboard

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Styling:** Tailwind CSS
- **Visualization:** D3.js
- **Analytics:** Vercel Analytics
- **Language:** TypeScript (strict mode)

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) project (for Books API + OAuth)

### Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/jtarps/booklinks.git
cd booklinks/project
npm install
```

2. Copy the environment template and fill in your keys:

```bash
cp .env.example .env.local
```

3. Run the database migrations:

```bash
npx supabase db push
```

4. Start the dev server:

```bash
npm run dev
```

### Environment Variables

See `.env.example` for the full list:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY` | Google Books API key |
| `OPENAI_API_KEY` | OpenAI key for AI reference discovery |

### Google OAuth Setup

1. Create an OAuth client ID in Google Cloud Console (Web application)
2. Add redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
3. Add the Client ID and Secret to Supabase Dashboard > Authentication > Providers > Google

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run seed` | Seed the database with sample books |

## Project Structure

```
app/
├── auth/           # Login, signup, password reset, OAuth callback
├── book/[slug]/    # Book detail page with references
├── explore/        # Interactive reference map (D3.js)
├── feedback/       # Admin feedback dashboard
├── lists/          # Reading lists (index + detail)
├── profile/        # User profile
├── stats/          # Analytics dashboard
├── error.tsx       # Error boundary
└── layout.tsx      # Root layout with header, footer, auth

components/
├── AddToListButton.tsx      # Add book to reading list dropdown
├── AuthProvider.tsx          # Auth context provider
├── BookSearch.tsx            # Homepage search with dual-source results
├── FeedbackButton.tsx        # Floating feedback widget
├── Footer.tsx                # Site footer with affiliate disclosure
├── ListVisibilityToggle.tsx  # Public/private list toggle
├── ReferenceList.tsx         # Book reference display
├── ShareButton.tsx           # Social sharing
└── UserMenu.tsx              # User dropdown with admin links

lib/
├── amazon.ts              # Geo-aware Amazon affiliate links
├── discoverReferences.ts  # AI reference discovery
├── googleBooks.ts         # Google Books API client
├── library.ts             # WorldCat + Open Library links
├── supabase-browser.ts    # Client-side Supabase
└── supabase-server.ts     # Server-side Supabase
```

## Deployment

The app is designed for [Vercel](https://vercel.com):

1. Import the repo on Vercel
2. Set environment variables in project settings
3. Add your custom domain
4. Enable Vercel Analytics in the dashboard

## License

Private project. All rights reserved.
