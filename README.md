# FiBrainAI

FiBrainAI is a Next.js website for the AI CFO product, with local fallback storage and server routes ready for Supabase.

## Local Preview

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
5. Add the same environment variables in Vercel before deployment.

Without Supabase env vars, the app keeps working locally through browser storage.

## Quality Checks

```bash
npm run lint
npm run build
```

## Deploy on Vercel

Import this project in Vercel, add the Supabase environment variables, and deploy. After deployment, attach your domain from the Vercel project domain settings.
