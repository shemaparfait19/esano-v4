# 🗺️ QUICK ROUTES MAP - Print This!

## File → URL Mapping

```
📁 FOLDER PATH                              →  🌐 URL IN BROWSER
═══════════════════════════════════════════════════════════════════

src/app/page.tsx                           →  http://localhost:3000/

src/app/login/page.tsx                     →  /login
src/app/signup/page.tsx                    →  /signup

src/app/dashboard/page.tsx                 →  /dashboard
src/app/dashboard/dna-analysis/page.tsx    →  /dashboard/dna-analysis
src/app/dashboard/relatives/page.tsx       →  /dashboard/relatives
src/app/dashboard/family-tree/page.tsx     →  /dashboard/family-tree
src/app/dashboard/ancestry/page.tsx        →  /dashboard/ancestry
src/app/dashboard/insights/page.tsx        →  /dashboard/insights
src/app/dashboard/assistant/page.tsx       →  /dashboard/assistant
src/app/dashboard/search/page.tsx          →  /dashboard/search
src/app/dashboard/profile/[userId]/page.tsx → /dashboard/profile/abc123
```

## API Endpoints

```
📁 FILE PATH                               →  🔌 API ENDPOINT
═══════════════════════════════════════════════════════════════════

src/app/api/dna/upload/route.ts           →  POST /api/dna/upload
src/app/api/dna/match/route.ts            →  POST /api/dna/match
src/app/api/requests/route.ts             →  POST /api/requests
src/app/api/assistant/route.ts            →  POST /api/assistant
```

## React vs Next.js - ONE SENTENCE

**Next.js IS React with extra features (routing, APIs, SSR)**

```
React Alone:           Next.js (Your Project):
├── Just UI            ├── UI (React)
├── Manual routing     ├── Auto routing (folders)
├── No backend         ├── Backend (API routes)
└── Separate server    └── All in one project
```

## Defense Answer

**Q: "What's your tech stack?"**

**A:** "Next.js 14 with TypeScript - Next.js is a React framework that adds file-based routing and API endpoints. The UI components use React (JSX, hooks), but Next.js handles the routing and backend."

**Q: "Where are your routes defined?"**

**A:** "In the folder structure. Next.js uses file-based routing - each folder with a page.tsx becomes a route. For example, `src/app/dashboard/relatives/page.tsx` automatically creates the `/dashboard/relatives` route."

## Quick Test - Can You Answer These?

❓ Where is the login page coded?
✅ `src/app/login/page.tsx` → Route: `/login`

❓ Where is the DNA upload page?
✅ `src/app/dashboard/dna-analysis/page.tsx` → Route: `/dashboard/dna-analysis`

❓ Where is the DNA matching API?
✅ `src/app/api/dna/match/route.ts` → Endpoint: `POST /api/dna/match`

❓ Is this React or Next.js?
✅ Both! Next.js is built on React. We use React for UI, Next.js for structure.

❓ How do you create a new route?
✅ Create a folder with `page.tsx` inside. The folder path becomes the URL.

---

**Memorize this! You're ready! 🚀**
