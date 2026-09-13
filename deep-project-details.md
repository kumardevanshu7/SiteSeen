# 🚀 SiteSeen — Complete Deep Technical Architecture & Project Blueprint

> **A to Z Comprehensive Engineering Documentation**  
> **Product:** SiteSeen  
> **Company / Ecosystem:** Arigato Labs  
> **Founder:** Kumar Devanshu (2026)  
> **Repository Stack:** Next.js 14 (App Router) · React 18 · TypeScript · Cloud Firestore · Firebase Auth & Admin SDK · Tailwind CSS · Shadcn UI  

---

## 📌 1. Project Overview & High-Level Summary (Kya Hai Yeh Project?)

**SiteSeen** is an ultra-fast, visually rich, and cryptographically secure **Visual Web Pinboard & Resource Intelligence System**. It transforms the way modern developers, designers, and creators collect, curate, search, and manage web assets.

Unlike traditional browser bookmarks (which are buried in text-only lists and quickly forgotten) or generic note apps (like Notion/Keep, which require tedious manual copy-pasting of titles, descriptions, and cover images), **SiteSeen is automated, visual-first, and highly protected**:

1. **One-Click Automated Scraping**: Paste any URL, and the server-side scraping engine fetches OpenGraph tags, high-resolution preview images, favicons, site titles, and descriptions in real time.
2. **Visual Masonry Grid**: Displays resources like Pinterest pins with full-height previews, category badges, tags, and direct launch triggers.
3. **Instant Search & Autocomplete**: Real-time multi-dimensional search filtering by keywords, domain hostnames, categories, and tags with substring highlighting.
4. **Dynamic Category Lifecycle**: Custom category management with atomic batch mutations in Firestore (renaming/deleting a category instantly updates all associated pins).
5. **Two-Tier Cryptographic Security (“One Password”)**: Standard Google OAuth authentication for session access, plus an isolated, server-verified cryptographic challenge-response gate for mutating data (Create, Update, Delete).

```
   ┌─────────────────────────────────────────────────────────────┐
   │                        SITESEEN UI                          │
   │   Visual Pinboard · Real-Time Search · Category Management  │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │ Google Bearer Token         │ + X-One-Password-Unlock
                   ▼                             ▼
   ┌─────────────────────────────────────────────────────────────┐
   │             NEXT.JS 14 SERVER (App Router APIs)             │
   │  /api/sites · /api/categories · /api/scrape · /api/one-pw   │
   └───────────────┬─────────────────────────────┬───────────────┘
                   │ Firebase Admin SDK          │
                   ▼                             ▼
   ┌────────────────────────────────┐ ┌──────────────────────────┐
   │    CLOUD FIRESTORE NO-SQL      │ │  EXTERNAL TARGET WEBSITES│
   │ sites · settings · security    │ │  (Scrapes OpenGraph HTML)│
   └────────────────────────────────┘ └──────────────────────────┘
```

---

## 💡 2. The Problem Statement & Motivation (Iski Need Kyun Padi?)

### The Real-World Friction:
1. **Bookmark Rot & Visual Amnesia**: Traditional browser bookmark bars are text-only. Developers and designers save 100+ links a month and cannot recall what `https://ui-snippets-v2.dev/tools/3948` was without clicking it.
2. **Tedious Manual Curation**: Creating a Notion database or Airtable requires manual copying of titles, taking screenshots, uploading image assets, and typing descriptions. This friction kills productivity.
3. **No Granular Mutation Security**: If an account or shared browser is unlocked, any accidental tap can wipe an entire database of curated inspiration.
4. **Poor Organization & Tag Discovery**: Browser bookmarks do not support multi-tag filtering, instant search autocomplete, or category batch renaming.

### Why SiteSeen Solves This:
- **Zero Friction**: Paste URL $\rightarrow$ metadata extracted automatically $\rightarrow$ tagged and categorized in under 2 seconds.
- **Visual Memory Match**: Human brains process images 60,000x faster than text. Seeing the website thumbnail immediately triggers memory.
- **Centralized Cloud Sync**: Available across all devices via Cloud Firestore without needing browser-specific extensions.

---

## 🛠️ 3. Complete Tech Stack & Tooling

| Layer | Technology | Why Chosen? |
|---|---|---|
| **Framework** | **Next.js 14 (App Router)** | Hybrid Server/Client components, built-in edge/node API routes, optimized font loading (`Geist`), and zero-config deployment. |
| **Language** | **TypeScript 5.x** | Strict end-to-end type safety across API request/response payloads, Firestore documents, and UI props. |
| **Styling** | **Tailwind CSS 3.4** | Utility-first, predictable design system tokens (Arigato Labs custom palette: canvas, hairline, surface-soft, ink, ash). |
| **UI Primitives** | **Radix UI / Shadcn UI / Base UI** | Accessible dialogs, drawers, badges, inputs, and skeletons without heavy bundle overhead. |
| **Icons & Notifications**| **Lucide React & Sonner** | Crisp iconography and modern animated stacked toast notifications. |
| **Authentication** | **Firebase Auth (Google OAuth)** | Seamless single sign-on (SSO), secure client-side token rotation, and battle-tested identity management. |
| **Database** | **Google Cloud Firestore (Admin SDK)** | Serverless NoSQL document database with ultra-low latency, real-time sync capabilities, and zero server maintenance. |
| **Scraper** | **Custom Server-Side Regex Engine** | Lightweight HTML parsing without heavy Puppeteer/Playwright headless browser overhead. Uses User-Agent emulation and Google S2 Favicon API fallback. |
| **Security Layer** | **Node.js Crypto (`crypto.createHmac`, `timingSafeEqual`)** | Zero-dependency cryptographic hashing (SHA-256 + salt) and tamper-proof HMAC unlock tokens. |
| **Email Service** | **Web3Forms** | Serverless contact delivery directly to founder inbox without managing SMTP credentials. |
| **Hosting & CI/CD** | **Vercel** | Edge network caching, serverless function auto-scaling, and environment variable isolation. |

---

## 🏗️ 4. End-to-End System Architecture & Data Flow (Kaise Kaam Karta Hai?)

### 🔄 1. URL Add & Scraping Flow
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as AddSiteDialog (Client)
    participant ScrapeAPI as /api/scrape (Server)
    participant TargetWeb as Target Website
    participant SiteAPI as /api/sites (Server)
    participant Firestore as Cloud Firestore

    User->>UI: Pastes target URL (e.g., github.com)
    UI->>ScrapeAPI: GET /api/scrape?url=github.com
    ScrapeAPI->>TargetWeb: HTTP GET (Custom Browser User-Agent)
    TargetWeb-->>ScrapeAPI: Returns HTML Document
    ScrapeAPI->>ScrapeAPI: Extracts <title>, og:image, og:description, favicon
    ScrapeAPI-->>UI: Returns JSON (title, desc, image, favicon)
    UI->>UI: Auto-fills form fields (User can edit/add tags)
    User->>UI: Clicks "Save Website"
    UI->>SiteAPI: POST /api/sites (Bearer GoogleToken + X-One-Password-Unlock)
    SiteAPI->>SiteAPI: Verify Google Token + Verify One-Password HMAC
    SiteAPI->>Firestore: db.collection("sites").add(siteDoc)
    Firestore-->>SiteAPI: Document Saved (ID generated)
    SiteAPI-->>UI: 201 Created (SavedSite object)
    UI->>User: Renders new card in Masonry grid + Success Toast
```

---

## 🗄️ 5. Database Schemas & Data Modeling (Schemas Kaun Se Hai & Kahan Se Bane Hai?)

SiteSeen uses **Google Cloud Firestore** (NoSQL Document Store). There are **3 core collections** designed with strict document separation and zero direct client read/write access.

### Collection 1: `sites`
Stores all saved websites and pins. Each document represents a single pinned resource.

```typescript
export interface SiteDoc {
  id?: string;              // Firestore auto-generated document ID
  url: string;              // Full normalized URL (e.g. "https://stripe.com")
  title: string;            // Web page title (scraped or customized)
  description: string;      // Summary or meta description
  category: string;         // e.g. "Design", "Dev", "Inspiration"
  tags: string[];           // Array of tag strings: ["ui", "css", "landing"]
  imageUrl?: string;        // Absolute URL to OpenGraph preview image
  favicon?: string;         // Absolute URL or Google S2 favicon URL
  createdAt: number;        // Epoch timestamp (Date.now())
  ownerUid: string;         // Firebase Auth UID of the user who owns this pin
}
```

- **Partitioning / Query Model**: Query is filtered by `ownerUid == user.uid` and sorted by `createdAt desc`.
- **Relationship**: 1 User $\rightarrow$ N Sites.

---

### Collection 2: `settings`
Stores user-specific configurations and the master **One Password** security document.

#### Document A: `settings/onePassword` (Challenge-Response Config)
```typescript
export interface OnePasswordDoc {
  question: string;         // User's custom challenge question (e.g. "My first pet?")
  answerHash: string;       // SHA-256(salt + normalized_answer)
  salt: string;             // 32-byte cryptographically secure random hex string
  ownerUid: string;         // UID of the authorized administrator/user
  setupAt: number;          // Timestamp when One Password was created
  updatedAt: number;        // Timestamp of last update
}
```

#### Document B: `settings/categories_{uid}` (Custom Categories)
```typescript
export interface UserCategoriesDoc {
  ownerUid: string;         // User UID
  names: string[];          // List of category names: ["Design", "Tech", "Dev", "AI", ...]
  updatedAt: number;        // Timestamp
}
```

---

### Collection 3: `security`
Stores audit logs, brute-force counters, and rate-limiting lockouts.

#### Document: `security/attempts_{uid}`
```typescript
export interface SecurityAttemptDoc {
  fails: number;            // Number of consecutive failed password attempts
  lastFailAt?: number;      // Epoch timestamp of last failed attempt
  lockedUntil?: number;     // Epoch timestamp until which the user is locked out
  lastOkAt?: number;        // Epoch timestamp of last successful unlock
}
```

---

## 🔒 6. Deep Security Architecture (Security Ke Liye Kya Steps Liye & Kaise Liye?)

SiteSeen implements an enterprise-grade **Defense-in-Depth** model:

```
                      INCOMING MUTATION REQUEST
                                  │
    ┌─────────────────────────────▼─────────────────────────────┐
    │  LAYER 1: Firebase Google OAuth JWT Token Verification   │
    │  - Checks Authorization: Bearer <token>                   │
    │  - Verified server-side via getAdminAuth().verifyIdToken()│
    └─────────────────────────────┬─────────────────────────────┘
                                  │ Passed
    ┌─────────────────────────────▼─────────────────────────────┐
    │  LAYER 2: Cryptographic "One Password" Challenge Gate     │
    │  - Checks Header: X-One-Password-Unlock                   │
    │  - Validates HMAC-SHA256 signature + timestamp expiration │
    │  - Ensures payload.uid === authenticated user.uid         │
    └─────────────────────────────┬─────────────────────────────┘
                                  │ Passed
    ┌─────────────────────────────▼─────────────────────────────┐
    │  LAYER 3: Server-Side Ownership Enforcement              │
    │  - Queries and mutations scoped strictly to ownerUid      │
    │  - Client cannot mutate documents belonging to other UIDs │
    └─────────────────────────────┬─────────────────────────────┘
                                  │ Passed
    ┌─────────────────────────────▼─────────────────────────────┐
    │  LAYER 4: Firestore Cloud Security Rules (Hard Lockdown) │
    │  - `allow read, write: if false;` on all client queries    │
    │  - 100% of database access is mediated by Admin SDK      │
    └───────────────────────────────────────────────────────────┘
```

### 1. Zero Direct Client Firestore Access (`firestore.rules`)
All client-side Firestore reads and writes are rejected at the database level:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Complete Lockdown
    }
  }
}
```
**Benefit:** Eliminates vulnerabilities where malicious users manipulate client-side Firebase SDKs to inject or wipe data.

### 2. Custom "One Password" Salted SHA-256 + HMAC Authentication
- **Zero Plaintext Storage**: The secret answer is normalized (`lowercase`, `trimmed`, `whitespace-collapsed`), salted with 32 random bytes (`crypto.randomBytes(32).toString('hex')`), and hashed using `SHA-256`.
- **Timing-Safe Verification**: Uses `crypto.timingSafeEqual()` to compare password hashes, protecting against timing side-channel attacks.
- **Signed Session Unlock Tokens**: Upon answering the challenge question, the server creates an HMAC-SHA256 signed token:
  $$\text{UnlockToken} = \text{Base64Url}(\text{JSON}\{\text{uid}, \text{exp}\}) + "." + \text{HMAC-SHA256}(\text{body}, \text{SECRET})$$
  - The token is valid for **30 minutes**.
  - Any tampering with the payload or signature immediately invalidates the token.

### 3. Server-Side Rate Limiting & Brute-Force Lockout
- If a user enters 5 incorrect answers to the security challenge:
  - The system locks the account for **15 minutes** (`lockedUntil = Date.now() + 15 * 60 * 1000`).
  - Returns HTTP `429 Too Many Requests`.

### 4. Resilient Private Key Sanitization (`firebase-admin.ts`)
Handling RSA private keys in Vercel environment variables is notoriously prone to formatting errors (e.g. escaped `\n` vs literal newlines, accidental surrounding quotes). SiteSeen includes a custom normalization layer:
```typescript
privateKey = privateKey.replace(/\\n/g, "\n");
```

---

## ⚡ 7. Core Functions & Feature Breakdown (Kya Kya Functions Hai?)

### 1. Intelligent URL Metadata Scraper (`/api/scrape`)
- Implements custom HTML scraping without slow headless browsers.
- Emulates modern browser headers (`User-Agent: Mozilla/5.0... Chrome/120.0`).
- Priority fallback parser:
  - **Title**: OpenGraph `og:title` $\rightarrow$ Standard `<title>` $\rightarrow$ Domain hostname.
  - **Description**: `og:description` $\rightarrow$ `<meta name="description">` $\rightarrow$ Fallback text.
  - **Image**: OpenGraph `og:image` (auto-resolves relative URLs to absolute URLs).
  - **Favicon**: `<link rel="icon">` $\rightarrow$ `<link rel="apple-touch-icon">` $\rightarrow$ Google S2 Favicon API (`https://www.google.com/s2/favicons?domain=hostname&sz=64`).
- Server-side Next.js cache revalidation for 1 hour (`next: { revalidate: 3600 }`).

### 2. Search, Filter & Multi-Tag Engine (`CollectionsPage.tsx`)
- **Multi-Factor Search**: Instant filtering across Title, URL Hostname, Description, Category, and Tags.
- **Autocomplete Suggestions**: Live dropdown matching exact pins, tags, or categories with query substring bolding.
- **Interactive Tag Clouds**: Shows top tags with frequency badges, allowing dynamic inclusion/exclusion.

### 3. Atomic Category Lifecycle & Cascade Updates (`/api/categories`)
- Users can create, rename, or delete categories.
- When a category is renamed or deleted, a **Firestore Batch Mutation (`db.batch()`)** scans all associated sites and atomically updates their `category` field in a single transaction. Deleting a category safely remaps sites to `"Uncategorized"`.

### 4. Detail Sheet & Dynamic Drawer (`SiteDetailSheet.tsx` & `/site/[id]`)
- Fast preview sheet opening directly from the masonry grid without losing scroll position.
- Dedicated standalone route (`/site/[id]`) with local session cache hydration (`sessionStorage.getItem`) for instantaneous page loads before network requests resolve.

---

## 🐞 8. Debugging & Fault Playbook (Koi Fault Ho Toh Kaise Debug Karoge?)

| Fault / Symptom | Root Cause | Step-by-Step Resolution |
|---|---|---|
| **500 Error on API Routes** (`Firebase Admin credentials missing`) | Missing or malformed Firebase Service Account environment variables. | 1. Check `.env.local` or Vercel Environment settings.<br>2. Verify `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY`.<br>3. Ensure `PRIVATE_KEY` has `-----BEGIN PRIVATE KEY-----` and proper newlines. |
| **401 Unauthorized** on `/api/sites` | Expired or missing Google ID Token. | 1. Open DevTools Network tab $\rightarrow$ Inspect `Authorization` header.<br>2. Check if `getIdToken()` in `auth-context.tsx` returned null.<br>3. Trigger `signInWithGoogle()` to refresh token. |
| **403 Forbidden** (`ONE_PASSWORD_LOCKED`) | Missing or expired `X-One-Password-Unlock` header on POST/PATCH/DELETE. | 1. Check `sessionStorage.getItem("siteseen_one_password_unlock")`.<br>2. Verify if 30-minute token TTL has elapsed.<br>3. Trigger `requireEditAccess()` to open One Password modal. |
| **429 Rate Limited** (`Too many failed attempts`) | 5 failed One Password attempts triggered server lockout. | 1. Check Firestore document `security/attempts_{uid}`.<br>2. Wait 15 minutes or manually reset `fails: 0` and `lockedUntil: 0` in Firestore Console. |
| **Scraper returns default domain title / empty image** | Target website blocks bot User-Agents or uses heavy client-side JavaScript rendering (SPA). | 1. Test target URL in `/api/scrape?url=...`.<br>2. If site blocks requests, fallback triggers automatically (domain name + Google S2 favicon).<br>3. User can manually type title and image URL in `AddSiteDialog`. |
| **Hydration Mismatch Warning** | Local storage / session storage read during initial React SSR pass. | 1. Ensure `typeof window !== "undefined"` checks inside `useEffect`.<br>2. Use `mounted` flags or Skeleton loaders before rendering client-only state. |

---

## 📈 9. Real-World Applications & Use Cases (Real Life Mein Kya Kaam?)

1. **Frontend Engineers & Designers**: Curating UI inspiration (micro-interactions, component libraries, landing page designs) with immediate visual thumbnails.
2. **Technical Researchers & Writers**: Saving developer documentation, RFCs, GitHub repositories, and AI whitepapers grouped under research tags (`#transformers`, `#auth`, `#infra`).
3. **Product Teams & Indie Hackers**: Competitive benchmarking, tracking competitor feature rollouts, pricing pages, and marketing copy.
4. **Agencies & Freelancers**: Presenting moodboards and curated reference websites to clients during project kickoff phases.

---

## 🧠 10. Key Engineering Learnings & Concepts Applied

1. **Security in Depth**: Never trusting client state; combining OAuth JWT verification with custom challenge-response HMAC tokens.
2. **Optimistic UI & Multi-Tier Caching**: Utilizing `sessionStorage` for instantaneous back-navigation and skeleton loaders to eliminate Cumulative Layout Shift (CLS).
3. **Atomic NoSQL Transactions**: Using `db.batch()` to maintain referential consistency in a non-relational database during category renames/deletes.
4. **Resilient Web Scraping**: Crafting regex parsers with resilient fallbacks and entity decoding without overloading server memory with headless Chromium instances.
5. **Clean Component Architecture**: Decoupling authentication state (`AuthContext`), security state (`OnePasswordContext`), and data layers (`db.ts`).
