# IMPORTANT

This project is built through vibe coding.

Prefer:
- simple solutions
- speed
- readability
- maintainability
- small iterations

Avoid:
- overengineering
- enterprise architecture
- unnecessary abstractions
- premature optimisation
 ## Authentication

MVP:
Google login required.

Authentication provider:
NextAuth / Auth.js with Google provider.

User model:
Each Google account is treated as a separate user.

Multi-user scope:
Simple personal/household separation only.

Data ownership:
Recipes, pantry items, meal history, and shopping lists must belong to a user.

Important:
This is NOT a commercial SaaS.
No teams.
No organisations.
No shared households in MVP.
No roles.
No admin panel.
No subscriptions.
No public profiles.

Primary use case:
Victor and a small number of friends can each use the app separately at home.

Future:
Optional household sharing or family profiles.
## Images

MVP:
Use local placeholder images.

Later:
Cloudinary.
## State Management

Prefer:
React state + server actions.

Avoid:
Redux, Zustand unless truly needed.



## Architecture Rules

Prefer:
simple structure
small files
server components by default

Avoid:
over abstraction
repository pattern
enterprise architecture
premature optimisation

## Database

Engine:
PostgreSQL

ORM:
Prisma

Database name:
smart_kitchen
Always keep a working version.