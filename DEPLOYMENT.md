# Deployment Checklist

## Supabase

1. Create a new Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Add these variables locally in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service role key is server-only. Do not expose it in client components.

## Vercel

1. Import the GitHub repo or local project into Vercel.
2. Set the same Supabase env vars in Project Settings > Environment Variables.
3. Deploy the production build.
4. In Project Settings > Domains, add the purchased domain.
5. Update your domain DNS records exactly as Vercel shows.

## Current Data Flows

- Waitlist submissions: `POST /api/waitlist`
- Build log entries: `GET/POST /api/build-logs`
- Co-founder applications: `GET/POST /api/cofounder-applications`

If Supabase is not configured, the website falls back to browser local storage so preview still works.
