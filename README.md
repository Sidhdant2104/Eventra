# NMIET Event Hub

A campus event platform for NMIET clubs and committees. Students keep one profile, register in one step, join teams, carry a QR pass, and collect certificates. Organizers build an event page, manage registrations, scan attendance, and issue certificates.

## Stack

Next.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Auth.js, Zod, React Hook Form.

## Setup

PostgreSQL needs to be running locally.

```bash
cp .env.example .env
# Set DATABASE_URL and AUTH_SECRET
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Demo password for every seeded account: `EventHub2026`

| Role | Email |
| --- | --- |
| Student | aarav@nmiet.edu.in |
| Student with a pending team invite | meera@nmiet.edu.in |
| Coding Club admin | coding.admin@nmiet.edu.in |
| Event manager | manager@nmiet.edu.in |
| Volunteer scanner | volunteer@nmiet.edu.in |
| Super admin | admin@nmiet.edu.in |

`npm run db:seed` resets demo data.

## Local fallbacks

- Email uses `EMAIL_PROVIDER=console`, which prints messages and appends `.dev-emails.log`. Set `EMAIL_PROVIDER=resend` with `RESEND_API_KEY` and `EMAIL_FROM` to send real email.
- Uploads use `STORAGE_DRIVER=local` and are written to `public/uploads`. Set `STORAGE_DRIVER=s3` plus the `S3_*` variables to use S3-compatible storage. That driver expects `@aws-sdk/client-s3` to be installed.
- Google sign-in turns on when `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set. Accounts and sessions are already modeled for OAuth.

The app is a PWA (manifest, icons, and a service worker) and the API is the same backend a native app could use later.
