# Smart Kitchen

MVP foundation for a single-household smart kitchen assistant.

## Stack

- Next.js full-stack App Router
- TypeScript
- Tailwind CSS
- shadcn/ui configuration
- Auth.js / NextAuth with Google login
- PostgreSQL
- Prisma
- Docker Compose for local database

## Project Structure

```txt
src/app/          Next.js App Router
src/components/   Shared UI components
src/components/ui shadcn/ui components
src/constants/    App constants
src/hooks/        React hooks
src/lib/          Shared client/server-safe helpers
src/server/       Server-only utilities
src/types/        Shared TypeScript types
prisma/           Prisma schema and migrations
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start PostgreSQL:

```bash
npm run db:up
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Authentication

Smart Kitchen uses Auth.js / NextAuth with Google login.

MVP ownership rule:

- One Google user equals one kitchen.
- No teams, organisations, roles, shared households, or admin panel.
- Future app data must belong to `User`.
- Future recipes, pantry items, meal history, and shopping lists should include `userId`.

Required environment variables:

```bash
DATABASE_URL="postgresql://postgres:123456@localhost:5432/smart_kitchen?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_GOOGLE_ID="replace-with-google-client-id"
AUTH_GOOGLE_SECRET="replace-with-google-client-secret"
AUTH_URL="http://localhost:3000"
CLOUDINARY_CLOUD_NAME="replace-with-cloudinary-cloud-name"
CLOUDINARY_API_KEY="replace-with-cloudinary-api-key"
CLOUDINARY_API_SECRET="replace-with-cloudinary-api-secret"
CLOUDINARY_UPLOAD_FOLDER="mesamate/recipes"
```

Generate a local secret:

```bash
npx auth secret
```

Google OAuth setup:

1. Create a Google OAuth client in Google Cloud Console.
2. Use application type `Web application`.
3. Add this local authorized redirect URI:

```txt
http://localhost:3000/api/auth/callback/google
```

4. Put the Google client ID in `AUTH_GOOGLE_ID`.
5. Put the Google client secret in `AUTH_GOOGLE_SECRET`.

For Coolify deployment:

- Set `AUTH_URL` to the deployed app URL, for example `https://smart-kitchen.example.com`.
- Add the production callback URL in Google Console:

```txt
https://smart-kitchen.example.com/api/auth/callback/google
```

- Set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`, and the Cloudinary variables in Coolify environment variables.
- Do not commit real secrets.

## Recipe Photos

Recipe photos are uploaded to Cloudinary from the create/edit recipe forms.
The app stores only the final Cloudinary URL in `Recipe.imageUrl`.

Accepted uploads:

- JPG, PNG, or WebP
- Maximum 5 MB

Required Cloudinary environment variables:

```bash
CLOUDINARY_CLOUD_NAME="replace-with-cloudinary-cloud-name"
CLOUDINARY_API_KEY="replace-with-cloudinary-api-key"
CLOUDINARY_API_SECRET="replace-with-cloudinary-api-secret"
CLOUDINARY_UPLOAD_FOLDER="mesamate/recipes"
```

## Production Container

The app includes a production Dockerfile for Coolify.

Build locally:

```bash
docker build .
```

Container start command:

```bash
npm run start
```

Coolify should provide PostgreSQL separately and inject these environment variables into the app container:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_GOOGLE_ID="replace-with-google-client-id"
AUTH_GOOGLE_SECRET="replace-with-google-client-secret"
AUTH_URL="https://your-mesamate-domain.example"
CLOUDINARY_CLOUD_NAME="replace-with-cloudinary-cloud-name"
CLOUDINARY_API_KEY="replace-with-cloudinary-api-key"
CLOUDINARY_API_SECRET="replace-with-cloudinary-api-secret"
CLOUDINARY_UPLOAD_FOLDER="mesamate/recipes"
```

Set the Google production callback URL to:

```txt
https://your-mesamate-domain.example/api/auth/callback/google
```

## Database

Local PostgreSQL runs in Docker with:

- Database: `smart_kitchen`
- User: `postgres`
- Password: `123456`
- Port: `5432`

Stop the database:

```bash
npm run db:down
```

The database uses a persistent Docker volume named `smart_kitchen_postgres_data`.

## Prisma Workflow

The schema currently includes only Auth.js authentication models. Add app domain models only when the first real feature needs them.

After changing `prisma/schema.prisma`:

```bash
npm run prisma:migrate
npm run prisma:generate
```

Open Prisma Studio:

```bash
npm run prisma:studio
```

Seed script placeholder:

```bash
npm run seed
```

## Notes

This project intentionally starts simple. Server components are the default, and future feature work should prefer small files, React state, and server actions before adding extra architecture.
