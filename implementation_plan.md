# 📋 الملف التنفيذي الشامل — مشروع نجوم الدوري (League Stars)

> **وثيقة تنفيذية واحدة شاملة** تحتوي كل ما يحتاجه المطور لبناء المشروع من الصفر حتى النشر.

---
---

# الفصل الأول: الرؤية والمكدس التقني

## 1.1 رؤية المشروع

موقع متكامل حديث للبطولات الكروية المحلية يقدم:
*   عرض مباشر للمباريات والنتائج والترتيب بالوقت الفعلي.
*   نظام تصويت تفاعلي لأفضل هدف بالجولة.
*   لوحة تحكم مدمجة سياقية للمشرفين دون الحاجة للوحة إدارية منفصلة.
*   هوية بصرية ديناميكية قابلة للتخصيص بالكامل من قاعدة البيانات.
*   أداء فائق وأرشفة قوية في محركات البحث (SEO) عبر Server-Side Rendering.

---

## 1.2 المكدس التقني المعتمد (Tech Stack)

| الطبقة | التقنية | النسخة |
| :--- | :--- | :---: |
| **الإطار الأساسي** | Next.js (App Router) | **15** |
| **اللغة** | TypeScript | أحدث |
| **التصميم** | Tailwind CSS | **4** |
| **مكونات UI** | shadcn/ui | أحدث |
| **قاعدة البيانات** | PostgreSQL | 16+ |
| **ORM** | Prisma | **6** |
| **التحقق من البيانات** | Zod | أحدث |
| **التخزين السحابي** | Cloudinary | — |
| **البث المباشر** | Server-Sent Events (SSE) | — |
| **بصمة المتصفح** | FingerprintJS | أحدث |
| **المصادقة** | JWT + HTTP-Only Cookies | — |
| **النشر** | Vercel | — |
| **الخط العربي** | Cairo (Google Fonts) | — |

---

## 1.3 القرارات المعمارية المعتمدة (Architectural Decisions)

| # | القرار | التفاصيل |
| :--- | :--- | :--- |
| **AD-1** | هيكلية المشروع | مشروع واحد متكامل (**Mono-repo**) يضم الفرونت والباك تحت Next.js |
| **AD-2** | نمط التنظيم | **Feature-Driven Development (FDD)** — تنظيم بالميزة وليس بالتصنيف التقني |
| **AD-3** | لوحة التحكم | مدمجة وسياقية (**Embedded & In-Context**) مع "وضع التعديل" (Edit Mode) |
| **AD-4** | حماية التصويت | IP + Browser Fingerprinting (بدون تسجيل دخول للجمهور) |
| **AD-5** | البث المباشر | **SSE** عبر Route Handlers + ReadableStream (متوافق مع Vercel بدون خادم إضافي) |
| **AD-6** | إدارة الحالة | **React Context** + `useReducer` عبر `AuthProvider` و `EditModeProvider` |
| **AD-7** | Caching | `revalidatePath()` + `revalidateTag()` بعد كل Server Action يُعدّل بيانات |

---
---

# الفصل الثاني: هيكل المجلدات (Folder Structure)

```text
league-stars-new/
├── prisma/
│   ├── schema.prisma                # مخطط الجداول والعلاقات الكامل
│   └── seed.ts                      # بيانات اختبارية شاملة (تشمل سيناريوهات كسر التعادل)
│
├── public/                          # الأصول الثابتة (شعارات، أيقونات)
│
└── src/
    ├── app/                         # ═══ طبقة التوجيه فقط (Thin Routing Layer) ═══
    │   ├── api/
    │   │   ├── auth/route.ts        # ممر تسجيل الدخول / التحقق من التوكن
    │   │   ├── vote/route.ts        # ممر استقبال الأصوات
    │   │   └── live/route.ts        # SSE endpoint — ReadableStream للبث المباشر
    │   │
    │   ├── matches/page.tsx         # → يستورد <MatchesPage /> فقط
    │   ├── scorers/page.tsx         # → يستورد <ScorersPage /> فقط
    │   ├── layout.tsx               # الخطوط + ميتا البيانات + Providers الجذرية
    │   └── page.tsx                 # → يستورد <LandingPage /> فقط
    │
    ├── features/                    # ═══ طبقة الميزات المستقلة (Feature Modules) ═══
    │   │
    │   ├── auth/                    # ── 1. المصادقة والأمان ──
    │   │   ├── actions.ts           #    Server Actions: login, logout
    │   │   ├── schemas.ts           #    Zod: loginSchema
    │   │   └── components/          #    LoginForm, LoginPage
    │   │
    │   ├── matches/                 # ── 2. المباريات والنتائج ──
    │   │   ├── actions.ts           #    Server Actions: createMatch, updateScore (+revalidateTag)
    │   │   ├── schemas.ts           #    Zod: createMatchSchema, updateScoreSchema
    │   │   ├── types.ts             #    Match, MatchStatus, StandingsRow
    │   │   ├── lib/
    │   │   │   └── standings-engine.ts  # خوارزمية الترتيب وكسر التعادل (7 مستويات)
    │   │   ├── hooks/
    │   │   │   └── use-live-score.ts    # EventSource hook للبث المباشر
    │   │   └── components/          #    MatchCard, MatchEditModal, StandingsTable
    │   │
    │   ├── teams/                   # ── 3. إدارة الفرق ──
    │   │   ├── actions.ts           #    CRUD + رفع الشعار (+revalidateTag)
    │   │   ├── schemas.ts           #    Zod: createTeamSchema, updateTeamSchema
    │   │   └── components/          #    TeamList, TeamForm, TeamCard
    │   │
    │   ├── players/                 # ── 4. اللاعبين والهدافين ──
    │   │   ├── actions.ts           #    CRUD + فحص تفرد رقم القميص (+revalidateTag)
    │   │   ├── schemas.ts           #    Zod: createPlayerSchema
    │   │   └── components/          #    ScorersTable, PlayerForm, PlayerAssignModal
    │   │
    │   ├── voting/                  # ── 5. تصويت الأهداف ──
    │   │   ├── actions.ts           #    submitVote, getVoteStats
    │   │   ├── schemas.ts           #    Zod: submitVoteSchema
    │   │   ├── hooks/
    │   │   │   └── use-fingerprint.ts   # توليد البصمة الرقمية للجهاز
    │   │   └── components/          #    GoalGallery, VoteButton, VoteStats
    │   │
    │   └── settings/                # ── 6. التحكم بالمظهر والمحتوى (CMS) ──
    │       ├── actions.ts           #    updateColors, updateHero, updateLogo (+revalidateTag)
    │       ├── schemas.ts           #    Zod: updateSettingsSchema, updateHeroSchema
    │       └── components/          #    ColorPicker, HeroEditModal, LogoUploader
    │
    ├── core/                        # ═══ الأدوات والمكونات المشتركة ═══
    │   ├── components/              #    UI مشتركة: Button, Dialog, Card, Spinner, EmptyState
    │   ├── layouts/                 #    Navbar, Footer, MobileNav
    │   ├── providers/
    │   │   ├── auth-provider.tsx    #    React Context: جلسة المشرف + useAuth() hook
    │   │   └── edit-mode-provider.tsx #  React Context: وضع التعديل + useEditMode() hook
    │   ├── theme/
    │   │   └── theme-provider.tsx   #    ThemeProvider: تحميل وتطبيق ألوان HSL من قاعدة البيانات
    │   └── lib/
    │       ├── prisma.ts            #    Prisma Client singleton
    │       ├── cloudinary.ts        #    Cloudinary client config
    │       ├── validation.ts        #    دوال تحقق مشتركة (parseFormData, validateSchema)
    │       └── errors.ts            #    ApiError class + handleActionError + formatZodErrors
    │
    └── styles/
        └── globals.css              #    متغيرات CSS (HSL) + Tailwind base + استيراد الخط
```

> [!TIP]
> **قاعدة ذهبية:** ملفات `src/app/` تحتوي فقط على التوجيه واستيراد المكونات — **كل المنطق والواجهات في `features/` و `core/`**.

---
---

# الفصل الثالث: مخطط قاعدة البيانات (Database Schema)

## 3.1 الجداول والعلاقات

```mermaid
erDiagram
    User {
        String id PK
        String username UK
        String passwordHash
        String role
        DateTime createdAt
    }

    Tournament {
        String id PK
        String name
        String type "knockout | group_stage"
        String status "upcoming | active | completed"
        Int groupCount
        Int qualifyingTeams
        DateTime startDate
        DateTime endDate
        DateTime archivedAt "nullable"
    }

    Team {
        String id PK
        String name UK
        String logoUrl
        DateTime createdAt
    }

    TournamentTeam {
        String id PK
        String tournamentId FK
        String teamId FK
        String groupName "nullable"
    }

    Player {
        String id PK
        String name
        Int jerseyNumber
        String teamId FK
        Int goalsCount "auto-calculated"
    }

    Match {
        String id PK
        String tournamentId FK
        String homeTeamId FK
        String awayTeamId FK
        Int homeScore "nullable"
        Int awayScore "nullable"
        Int homePenalty "nullable"
        Int awayPenalty "nullable"
        String status "scheduled | live | finished | cancelled"
        String stage "group | round_16 | quarter | semi | final"
        String groupName "nullable"
        String venue
        DateTime matchDate
    }

    Goal {
        String id PK
        String matchId FK
        String playerId FK
        String teamId FK
        String type "normal | penalty | own_goal | free_kick"
        Int minute
        String videoUrl "nullable — لترشيح هدف الجولة"
        Boolean isNominated "false"
    }

    Card {
        String id PK
        String matchId FK
        String playerId FK
        String teamId FK
        String type "yellow | red | second_yellow"
        Int minute
    }

    GoalVote {
        String id PK
        String goalId FK
        String visitorIp
        String fingerprint
        DateTime votedAt
    }

    Sponsor {
        String id PK
        String name
        String logoUrl
        String websiteUrl "nullable"
        Int displayOrder
        Boolean isActive
    }

    Setting {
        String id PK
        String key UK
        String value
    }

    Content {
        String id PK
        String section UK
        String title
        String body
        String imageUrl "nullable"
    }

    Tournament ||--o{ TournamentTeam : "has"
    Team ||--o{ TournamentTeam : "participates"
    Team ||--o{ Player : "has"
    Tournament ||--o{ Match : "has"
    Team ||--o{ Match : "home"
    Team ||--o{ Match : "away"
    Match ||--o{ Goal : "has"
    Match ||--o{ Card : "has"
    Player ||--o{ Goal : "scored"
    Player ||--o{ Card : "received"
    Goal ||--o{ GoalVote : "has"
```

## 3.2 القيود الهامة (Constraints)

| القيد | الجدول | التفاصيل |
| :--- | :--- | :--- |
| **تفرد رقم القميص** | `Player` | `@@unique([teamId, jerseyNumber])` — لا يمكن تكرار الرقم في نفس الفريق |
| **تفرد التصويت** | `GoalVote` | `@@unique([goalId, fingerprint])` — صوت واحد لكل جهاز لكل هدف |
| **منع مباراة ذاتية** | `Match` | فحص برمجي: `homeTeamId !== awayTeamId` |
| **حذف متتابع** | `Goal, Card` | `onDelete: Cascade` — حذف المباراة يحذف أهدافها وبطاقاتها |
| **تفرد المفتاح** | `Setting` | `key @unique` — مفتاح واحد لكل إعداد |

---
---

# الفصل الرابع: الأنظمة الأساسية (Core Systems)

## 4.1 نظام المصادقة والأمان (Authentication & Security)

### تدفق تسجيل الدخول

```mermaid
sequenceDiagram
    participant Admin as المشرف
    participant Client as المتصفح
    participant Server as Next.js Server
    participant DB as PostgreSQL

    Admin->>Client: إدخال اسم المستخدم وكلمة المرور
    Client->>Server: Server Action: login(credentials)
    Server->>Server: التحقق بـ Zod (loginSchema)
    Server->>DB: البحث عن المستخدم + مقارنة bcrypt
    DB-->>Server: بيانات المستخدم
    Server->>Server: توليد JWT Token
    Server->>Client: Set-Cookie: adminToken (HTTP-Only, Secure, SameSite)
    Client->>Client: AuthProvider يحدّث الحالة → isAdmin = true
    Client->>Client: يظهر زر "وضع التعديل" في الـ Navbar
```

### طبقات الحماية

| الطبقة | الآلية | الملف |
| :--- | :--- | :--- |
| **1. التحقق من الإدخال** | Zod schema validation لكل Server Action | `features/*/schemas.ts` |
| **2. Middleware** | فحص JWT من الكوكيز في كل طلب للمسارات المحمية | `src/middleware.ts` |
| **3. Server Actions** | التحقق من التوكن قبل أي عملية CRUD | `features/*/actions.ts` |
| **4. HTTP-Only Cookies** | منع JavaScript من قراءة التوكن (حماية XSS) | `core/lib/` |
| **5. Lazy Loading** | كود الإدارة لا يُحمَّل للزوار العاديين أصلاً | `next/dynamic` |

---

## 4.2 نظام لوحة التحكم المدمجة (Embedded Admin)

### المبدأ
بدلاً من لوحة تحكم منفصلة، يتم **دمج أدوات التعديل مباشرة** في الصفحات العامة وتظهر فقط عند تفعيل "وضع التعديل".

### آلية العمل

```tsx
// ═══ 1. EditModeProvider ═══
// src/core/providers/edit-mode-provider.tsx
'use client';
const EditModeContext = createContext({ isEditMode: false, toggle: () => {} });

export function EditModeProvider({ children }) {
  const [isEditMode, setIsEditMode] = useState(false);
  return (
    <EditModeContext.Provider value={{ isEditMode, toggle: () => setIsEditMode(prev => !prev) }}>
      {children}
    </EditModeContext.Provider>
  );
}
export const useEditMode = () => useContext(EditModeContext);
```

```tsx
// ═══ 2. مكون مشترك: كرت المباراة ═══
// src/features/matches/components/match-card.tsx
import dynamic from 'next/dynamic';
import { useEditMode } from '@/core/providers/edit-mode-provider';

// تحميل المودال الإداري بالطلب فقط (لا يُحمَّل للزوار)
const MatchEditModal = dynamic(() => import('./match-edit-modal'), { ssr: false });

export default function MatchCard({ match }) {
  const { isEditMode } = useEditMode();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative border p-4 rounded-xl">
      <div>{match.homeTeam} VS {match.awayTeam}</div>
      <div>{match.homeScore} - {match.awayScore}</div>

      {/* ✏️ يظهر فقط في وضع التعديل */}
      {isEditMode && (
        <button onClick={() => setShowModal(true)} className="absolute top-2 right-2">
          <EditIcon />
        </button>
      )}

      {showModal && <MatchEditModal match={match} onClose={() => setShowModal(false)} />}
    </div>
  );
}
```

```tsx
// ═══ 3. تأمين Server Action ═══
// src/features/matches/actions.ts
'use server';
import { revalidateTag } from 'next/cache';
import { verifyAdmin } from '@/core/lib/auth';
import { updateScoreSchema } from './schemas';

export async function updateMatchScore(formData: FormData) {
  // 🔒 الحماية الأولى: التحقق من الصلاحية
  await verifyAdmin(); // يرمي خطأ إذا لم يكن أدمن

  // 🔒 الحماية الثانية: التحقق من صحة البيانات
  const data = updateScoreSchema.parse(Object.fromEntries(formData));

  // ✅ تنفيذ العملية
  await prisma.match.update({ where: { id: data.matchId }, data: { ... } });

  // 🔄 إبطال الكاش فوراً
  revalidateTag('matches');
  revalidateTag('standings');
  revalidateTag('scorers');
}
```

> [!CAUTION]
> **الأمان الحقيقي في السيرفر دائماً.** حتى لو عرض مستخدم خبيث أزرار التعديل عبر CSS، لن يستطيع تنفيذ أي عملية بدون JWT صحيح يُفحص في `verifyAdmin()`.

---

## 4.3 نظام البث المباشر (SSE — Server-Sent Events)

### لماذا SSE وليس WebSocket؟
*   **Vercel لا يدعم WebSocket** — يحتاج خادم منفصل.
*   **SSE يعمل مع Vercel** عبر Route Handlers + ReadableStream.
*   **إعادة الاتصال التلقائي** مدمجة في `EventSource` API.
*   **أحادي الاتجاه** (سيرفر ← عميل) وهو كافٍ لعرض النتائج المباشرة.

### آلية العمل

```tsx
// ═══ SSE Endpoint ═══
// src/app/api/live/route.ts
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // إرسال نبضة كل 30 ثانية للحفاظ على الاتصال
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      // الاستماع لتحديثات النتائج (عبر آلية pub/sub داخلية أو polling)
      const onUpdate = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // تنظيف عند إغلاق الاتصال
      return () => clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

```tsx
// ═══ useLiveScore Hook ═══
// src/features/matches/hooks/use-live-score.ts
'use client';
export function useLiveScore(matchId: string) {
  const [score, setScore] = useState(null);

  useEffect(() => {
    const source = new EventSource('/api/live');

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.matchId === matchId) setScore(data);
    };

    return () => source.close();
  }, [matchId]);

  return score;
}
```

---

## 4.4 خوارزمية كسر التعادل (Standings Tie-Breaker Engine)

### الموقع: `src/features/matches/lib/standings-engine.ts`

### مستويات الفرز (بالترتيب)

| الأولوية | المعيار | الوصف |
| :---: | :--- | :--- |
| **1** | النقاط الإجمالية | فوز = 3، تعادل = 1، خسارة = 0 |
| **2** | المواجهات المباشرة (H2H Points) | النقاط بين الفرق المتعادلة فقط |
| **3** | فارق أهداف المواجهات المباشرة (H2H GD) | فارق الأهداف في المباريات المباشرة فقط |
| **4** | فارق الأهداف الإجمالي (Overall GD) | (له - عليه) في جميع مباريات المجموعة |
| **5** | الأهداف المسجلة إجمالاً | إجمالي الأهداف المسجلة |
| **6** | نقاط اللعب النظيف | أصفر = -1، أحمر غير مباشر = -3، أحمر مباشر = -4 |
| **7** | القرعة | الخيار النهائي |

### Pseudocode

```text
function sortStandings(teams[], matches[], cards[]):
  1. حساب النقاط الإجمالية لكل فريق من نتائج المباريات
  2. تجميع الفرق المتعادلة في النقاط في مجموعات فرعية
  3. لكل مجموعة متعادلة:
     a. تصفية المباريات المباشرة بينهم فقط
     b. حساب نقاط المواجهات المباشرة → إذا اختلفت → فرز
     c. حساب فارق أهداف المواجهات المباشرة → إذا اختلف → فرز
     d. حساب فارق الأهداف الإجمالي → إذا اختلف → فرز
     e. حساب الأهداف المسجلة إجمالاً → إذا اختلف → فرز
     f. حساب نقاط اللعب النظيف (البطاقات) → إذا اختلفت → فرز
     g. القرعة (ترتيب يدوي من المشرف)
  4. إرجاع الترتيب النهائي
```

---

## 4.5 طبقة التحقق والأخطاء الموحدة (Validation & Error Handling)

### ملف التحقق المشترك: `src/core/lib/validation.ts`

```typescript
import { ZodSchema, ZodError } from 'zod';

export function validateAction<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ActionError('VALIDATION_ERROR', formatZodErrors(error));
    }
    throw error;
  }
}

function formatZodErrors(error: ZodError): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}
```

### ملف الأخطاء: `src/core/lib/errors.ts`

```typescript
export class ActionError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export function handleActionError(error: unknown) {
  if (error instanceof ActionError) {
    return { success: false, error: error.message, code: error.code };
  }
  console.error('Unexpected error:', error);
  return { success: false, error: 'حدث خطأ غير متوقع', code: 'INTERNAL_ERROR' };
}
```

### نمط استخدام موحد في كل Server Action

```typescript
'use server';
export async function createTeam(formData: FormData) {
  try {
    await verifyAdmin();
    const data = validateAction(createTeamSchema, Object.fromEntries(formData));
    const team = await prisma.team.create({ data });
    revalidateTag('teams');
    return { success: true, data: team };
  } catch (error) {
    return handleActionError(error);
  }
}
```

---

## 4.6 إدارة الحالة المشتركة (State Management)

| Provider | الملف | الـ Hook | الوظيفة |
| :--- | :--- | :--- | :--- |
| **AuthProvider** | `core/providers/auth-provider.tsx` | `useAuth()` | يوفر `isAdmin`, `user`, `logout()` |
| **EditModeProvider** | `core/providers/edit-mode-provider.tsx` | `useEditMode()` | يوفر `isEditMode`, `toggle()` |
| **ThemeProvider** | `core/theme/theme-provider.tsx` | `useTheme()` | يوفر الألوان الديناميكية من قاعدة البيانات |

### الترتيب في `layout.tsx`

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairoFont.className}>
        <AuthProvider>
          <EditModeProvider>
            <ThemeProvider>
              <Navbar />
              <main>{children}</main>
              <Footer />
            </ThemeProvider>
          </EditModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

## 4.7 استراتيجية Caching & Revalidation

### خريطة Tags المعتمدة

| الـ Tag | يُستخدم في الصفحات | يُبطل عند |
| :--- | :--- | :--- |
| `standings` | صفحة الترتيب، الرئيسية | تحديث نتيجة مباراة، إضافة بطاقة |
| `scorers` | صفحة الهدافين | تسجيل هدف جديد |
| `matches` | جدول المباريات، الرئيسية | إضافة / تعديل / حذف مباراة |
| `teams` | قائمة الفرق، جدول المباريات | إضافة / تعديل فريق |
| `settings` | جميع الصفحات (الألوان، الشعار، الهيرو) | تعديل أي إعداد عام |
| `sponsors` | شريط الرعاة | إضافة / تعديل / حذف راعٍ |

### نمط الاستخدام في Server Components

```tsx
// جلب البيانات مع تفعيل Caching by Tag
const matches = await prisma.match.findMany({ ... });
// في fetch: { next: { tags: ['matches'] } }
```

---
---

# الفصل الخامس: نظام التصميم والهوية البصرية (Design System)

## 5.1 لوحة الألوان (ديناميكية من قاعدة البيانات)

| اللون | الاستخدام | القيمة الافتراضية | متغير CSS |
| :--- | :--- | :--- | :--- |
| **الأساسي** | الأزرار، الروابط، الهيدر | `#750722` (عنابي) | `--primary` |
| **النص الداكن** | النصوص الأساسية | `#2c3e50` | `--text-color` |
| **التأكيد** | VS، البث المباشر، الأزرار النشطة | `#C92142` (قرمزي) | `--accent` |
| **الخلفية** | خلفية الصفحات | `#f8f9fa` | `--background` |
| **الحدود** | تقسيم المساحات | `#e9ecef` | `--border` |

> [!TIP]
> يتم تخزين الألوان كقيم HSL في جدول `Setting` وتحميلها عبر `ThemeProvider` وتطبيقها على `document.documentElement` كمتغيرات CSS مخصصة.

## 5.2 الخط والتصميم العام
*   **الخط:** Cairo (Google Fonts) — عربي عصري وواضح.
*   **الطابع:** رياضي فخم ومهيب.
*   **التأثيرات:** AOS (fade-up, zoom-in) + micro-animations عند hover.
*   **التجاوب:**
    *   **سطح المكتب:** جداول بعرض مقسم بدقة.
    *   **الجوال:** بطاقات عريضة (`mobile-match-card`) للقراءة باللمس.

## 5.3 حالات الواجهة (UI States)

| الحالة | العرض | السلوك |
| :--- | :--- | :--- |
| **زائر** | المباريات + الرعاة + الهدافين + التصويت | اطلاع فقط + تصويت لمرة واحدة |
| **مشرف (عادي)** | نفس الزائر + زر "وضع التعديل" | تصفح كزائر لمعاينة الشكل |
| **مشرف (وضع التعديل)** | أيقونات ✏️ و 🗑️ على كل عنصر قابل للتعديل | CRUD كامل عبر Modals سياقية |
| **تحميل** | Spinner + إخفاء المحتوى | Fade In عند اكتمال الجلب |
| **فارغة** | أيقونة + نص توضيحي + زر توجيه | "لا توجد مباريات اليوم" |

---
---

# الفصل السادس: الميزات الوظيفية الكاملة (Feature Specifications)

## 6.1 نظام البطولات
*   إنشاء بطولة بنوعها (خروج مغلوب / مجموعات + خروج مغلوب).
*   تحديد التواريخ وعدد المجموعات والفرق المتأهلة.
*   ربط الفرق المشاركة ديناميكياً.
*   **إنهاء وأرشفة البطولة:** إتاحة خيار "إنهاء البطولة" للمشرف، والذي يغير حالة البطولة إلى `completed` ويسجل تاريخ الأرشفة في `archivedAt` للحفاظ على سجلها التاريخي وعرضه مستقبلاً في معرض البطولات.

## 6.2 إدارة الفرق واللاعب�# الفصل الثامن: خطة إعادة الهيكلة البصرية والتفاعلية الثورية (Ultimate UI/UX Overhaul)

> **الرؤية الجديدة:** التخلي عن كافة قيود التصميم العمودي الكلاسيكي الجاف، وإعادة بناء الموقع بالكامل ليكون **منصة رياضية غامرة (Immersive Sports Platform)** تعتمد على جماليات شبكات الـ Bento والتفاعل الحركي الفاخر مع تجربة لمسية تحاكي تطبيقات الهاتف الحديثة (Native App Feel).

---

## 8.1 نظام التصميم والجماليات الثورية (Futuristic Sporty Aesthetic)

*   **شبكة بينتو التفاعلية (Interactive Bento Grid):**
    *   تحويل الصفحة الرئيسية إلى تخطيط **Bento Grid** متداخل يحتوي على كتل (Widgets) تفاعلية غير متساوية الأحجام، حيث تنبض كل كتلة بوظيفة محددة:
        *   **كتلة البث المباشر (Live Widget):** تحتل المساحة الأكبر، وتعرض بطاقة مباراة جارية بإطار نيون متوهج متحرك.
        *   **كتلة الهداف التاريخي (Top Scorer Hero Widget):** تعرض كرت فخم للمتصدر مع صورته وظل ذهبي يتوهج خلفه وإحصائيات ثلاثية الأبعاد.
        *   **كتلة هدف الجولة (Weekly Goal Video):** كتلة عريضة تشغل فيديو ترويجي صامت تلقائياً عند تمرير الفأرة فوقها (Hover-to-Play).
        *   **كتلة إحصائيات البطولة (Tournament Pulse):** إحصائيات دائرية تفاعلية تتغير قيمها حركياً (Counter Animation) عند التحميل.
*   **جمالية نيون النادي الفاخرة (Burgundy Neon Mode):**
    *   الخلفية ليست مجرد لون داكن، بل **شبكة جسيمات رياضية (Sporty Particle Grid)** مع تدرجات نيون ناعمة تدمج العنابي الغامق `#750722` بالوردي الكهربائي `#c92142` والأسود الفحمي.
    *   استخدام **الحدود المتدرجة المضيئة (Gradient Border Glows)** التي تعطي إيحاءً بأن الكروت تطفو فوق شاشة الجوال.
*   **الهوية الحيوية للفرق:**
    *   عرض شعارات الفرق داخل إطارات دائرية بيضاء مضيئة مع ظل مخصص لإبراز الهوية البصرية للأندية ومقاومة الخلفيات الغامقة.

---

## 8.2 الميزات التفاعلية وحركية الوقت الفعلي (Ultra-Interactivity & SSE Animations)

*   **مركز المباريات التفاعلي (Interactive Match Center):**
    *   عند الضغط على كرت المباراة، لا يفتح صفحة جديدة، بل **يتمدد الكرت حركياً في مكانه (Expandable Card Transition)** ليعرض:
        *   **محلل المواجهات المباشرة (H2H Analyzer):** مقارنة تفاعلية سريعة لنتائج الفريقين التاريخية ونسب الفوز.
        *   **جدول زمن الأحداث (Event Timeline):** خط زمني أنيق يعرض أوقات الأهداف والبطاقات بأيقونات متحركة.
*   **وميض النتيجة الحركي (SSE Score Flash):**
    *   عند تحديث نتيجة مباراة بالوقت الفعلي عبر SSE، يتم تفعيل سلسلة أنيميشن:
        1.  يتحول الرقم القديم للأسفل ويظهر الرقم الجديد من الأعلى بحركة دوران ثلاثية الأبعاد (3D Flip Counter).
        2.  ينبثق وميض أخضر فسفوري خفيف حول النتيجة للتنبيه الفوري.
        3.  تتساقط قصاصات ورق ملونة (Confetti) صغيرة جداً في كرت المباراة إذا كان الهدف للبطولة.
*   **رقاقات التصفية المغناطيسية (Magnetic Category Chips):**
    *   استبدال خيارات التصفية بأزرار مستديرة جذابة (Chips) تتبع حركة الإصبع/المؤشر بنظام الجذب المغناطيسي (Magnetic Hover Effect) مع انتقال انسيابي مرن للمحتويات أسفلها دون أي وميض أو تأخير.
*   **جدول الترتيب التفاعلي (Interactive Standings):**
    *   عند نقر المستخدم على اسم فريق في جدول الترتيب، يتم تسليط الضوء (Highlight) على جميع مباريات هذا الفريق وتلوين صفوفه لربط البيانات بصرياً.

---

## 8.3 تجربة الجوال الثورية (Ultimate Mobile-First Experience)

*   **شريط التنقل السفلي العائم (Floating Bottom Tab Bar):**
    *   تصميم شريط سفلي زجاجي مقوس يطفو فوق المحتوى ويحتوي على أيقونات تفاعلية تنبض وتتمدد عند اختيارها مع اهتزاز بصري خفيف (Micro-haptic visual feedback).
*   **معرض الأهداف بطابع القصص (Instagram-style Stories Viewer):**
    *   في الجوال، يتم عرض أهداف الجولة كقصص (Stories) علوية دائرية متوهجة، عند الضغط عليها يفتح مشغل فيديو رأسي كامل الشاشة يتيح السحب للأعلى (Swipe Up) للانتقال للهدف التالي والسحب للأسفل للإغلاق.
*   **إيماءات اللمس السريعة (Gesture Controls):**
    *   تمكين سحب كروت المباريات يميناً ويساراً (Swipe Gestures) للتنقل بين الجولات السابقة والقادمة بسلاسة.
*   **تفاعلات اللمس الناعمة (Micro-haptic Feedback Simulation):**
    *   تأثيرات تصغير خفيفة جداً عند الضغط على الأزرار وكروت المباريات (`active:scale-[0.97]`) لإعطاء إحساس تفاعلي وفيزيائي حقيقي عند اللمس.

---

## 8.4 إعادة تصميم واجهة التصويت الفائقة (Gamified Trophy Voting)

*   **التصويت بالشحن اللمسي (Long Press to Charge Vote):**
    *   بدلاً من الضغط التقليدي، يقوم المستخدم بالضغط المطول (Hold to Vote) على زر التصويت، ليرى مؤشر شحن دائري يمتلئ بجزيئات نيون مشعة. عند اكتمال الشحن، ينطلق أنيميشن انفجار جزيئي (Particle Burst) لتأجيل تسجيل الصوت بطابع تشويقي.
*   **أعمدة النسب ثلاثية الأبعاد (3D Interactive Progress Bars):**
    *   تظهر نتائج التصويت كأعمدة زجاجية ملونة تتوهج ديناميكياً وتتحرك بنعومة عند فتح الصفحة، مع إمكانية تمرير الإصبع لمعرفة عدد الأصوات الدقيق لكل هدف.

---

## المرحلة 6: التطوير والتنفيذ الثوري للواجهات (Ultimate Overhaul Phase)

- [ ] **إعداد البنية البصرية الأساسية والمؤثرات (Global Theme & Background Grid):**
    *   [ ] إعداد تدرج الخلفية الرياضية الديناميكي وشبكة الجسيمات التفاعلية.
    *   [ ] برمجة وتثبيت شريط التنقل السفلي العائم للجوال (Floating Bottom Tab Bar) بتأثيراته المغناطيسية.
- [ ] **بناء شبكة الـ Bento التفاعلية بالصفحة الرئيسية:**
    *   [ ] تصميم وتوزيع كتل الـ Bento لصفحة الهبوط (كتلة البث، الهداف، فيديو الهدف، والإحصائيات).
    *   [ ] بناء حركات التعداد الرقمي التفاعلية (Counter Animations) عند فتح الصفحة.
- [ ] **إعادة صياغة مركز المباريات والكروت الحية:**
    *   [ ] بناء الكروت المتمددة (Expandable Match Cards) وحركات الانتقال السلسة.
    *   [ ] برمجة محلل المواجهات المباشرة (H2H Analyzer) والخط الزمني للأحداث.
    *   [ ] برمجة تأثير الـ 3D Flip Counter والوميض المتوهج للنتائج المباشرة عبر SSE.
    *   [ ] برمجة قارئ حركات السحب الأفقي (Swipe) للتنقل بين الجولات على الجوال.
- [ ] **إعادة هيكلة صفحات الهدافين والترتيب:**
    *   [ ] تصميم جدول الترتيب التفاعلي مع خاصية تسليط الضوء الفوري على مباريات الفرق.
    *   [ ] تصميم رقاقات التصفية المغناطيسية (Magnetic Chips).
- [ ] **تطوير واجهة التصويت التفاعلية (Trophy Voting Room):**
    *   [ ] برمجة ميزة التصويت بالشحن اللمسي (Long Press to Vote) وتأثير الانفجار الجزيئي.
    *   [ ] إعداد مشغل الأهداف الرأسي للجوال (Instagram-style Stories Viewer) الداعم للسحب.
    *   [ ] برمجة أعمدة إحصائيات التصويت الزجاجية ثلاثية الأبعاد.

---
---eware للتحقق من هوية المشرف
- [ ] إنشاء Zod schemas:
    - [ ] `features/auth/schemas.ts` → `loginSchema`
    - [ ] `features/matches/schemas.ts` → `createMatchSchema`, `updateScoreSchema`
    - [ ] `features/teams/schemas.ts` → `createTeamSchema`
    - [ ] `features/players/schemas.ts` → `createPlayerSchema`
    - [ ] `features/voting/schemas.ts` → `submitVoteSchema`
    - [ ] `features/settings/schemas.ts` → `updateSettingsSchema`
    - [ ] `features/tournaments/schemas.ts` → `createTournamentSchema`, `updateTournamentSchema`
- [ ] تطوير Server Actions للبطولات (إنشاء، تعديل، إنهاء وأرشفة البطولة `archiveTournament`)
- [ ] تطوير Server Actions مع `revalidatePath` / `revalidateTag`
- [ ] ربط Cloudinary لرفع الشعارات والوسائط
- [ ] تطوير Server Actions لإدارة اللاعبين + فحص تفرد رقم القميص
- [ ] تطوير منطق تحديث نتائج المباريات وحالاتها

---

## المرحلة 3: بناء الواجهات + محرك الترتيب

- [ ] إعداد نظام ألوان HSL الديناميكي مع Tailwind CSS 4
- [ ] إنشاء `AuthProvider` (`core/providers/auth-provider.tsx`)
- [ ] إنشاء `EditModeProvider` (`core/providers/edit-mode-provider.tsx`)
- [ ] تغليف `layout.tsx` بالـ Providers (Auth + EditMode + Theme)
- [ ] تطوير الهيدر والفوتر والروابط الاجتماعية الديناميكية
- [ ] **كتابة `standings-engine.ts`** (خوارزمية كسر التعادل — 7 مستويات)
- [ ] بناء الصفحة الرئيسية (البطل + مباريات اليوم + الرعاة + من نحن)
- [ ] بناء صفحة جدول المباريات + الترتيب التلقائي (يستخدم standings-engine)
- [ ] بناء صفحة أفضل الهدافين (ذهبي/فضي/برونزي للمراكز الأولى)
- [ ] بناء صفحة معرض أهداف الجولة (فيديوهات + نسب تصويت)

---

## المرحلة 4: أدوات التعديل والميزات التفاعلية

- [ ] بناء صفحة تسجيل دخول المشرف
- [ ] إضافة مفتاح "وضع التعديل" في الـ Navbar
- [ ] تطوير Inline Edit Modals عبر `next/dynamic` (lazy loading)
- [ ] تمكين وضع التعديل على: كروت المباريات، الرعاة، البطل، الهدافين
- [ ] تطبيق Browser Fingerprinting في واجهة التصويت
- [ ] **تفعيل SSE:**
    - [ ] `src/app/api/live/route.ts` → ReadableStream
    - [ ] `src/features/matches/hooks/use-live-score.ts` → EventSource
    - [ ] ربط تحديث النتائج بأحداث SSE

---

## المرحلة 5: التدقيق والنشر

- [ ] اختبار التجاوب (Mobile + Tablet + Desktop)
- [ ] **اختبار خوارزمية كسر التعادل** ببيانات Seed المُعدّة
- [ ] فحص حماية الممرات الإدارية (صد بدون توكن)
- [ ] اختبار التصويت (منع تكرار الأصوات)
- [ ] **فحص Caching/Revalidation** (تحديث فوري بعد كل تعديل)
- [ ] فحص SEO Core Web Vitals
- [ ] نشر على Vercel + قاعدة بيانات PostgreSQL سحابية مؤمنة

---
---

# الفصل الثامن: خطة إعادة الهيكلة البصرية والتفاعلية (Design & Interaction Overhaul)

> **الهدف:** الانتقال بالموقع من مجرد واجهة عرض تقليدية جافة إلى **منصة رياضية حية، تفاعلية، ونابضة بالحياة**، تركز بشكل كامل على تقديم تجربة استثنائية لمستخدم الجوال (Mobile-First) وتجذب زوار البطولة.

---

## 8.1 البصمة البصرية الجديدة (Premium Sporty Vibe)

*   **بطاقات Glassmorphism التفاعلية:**
    *   استخدام تصميم الكروت الزجاجية العائمة (`bg-neutral-900/40 backdrop-blur-md`) بحدود مضيئة ناعمة (`border-white/10`).
    *   إضافة ظل خلفي متوهج خفيف بلون النادي يرتفع ويتسع عند مرور المؤشر (Hover Effect).
*   **التدرجات اللونية الحركية (Gradient Grids):**
    *   دمج خلفيات الصفحات بتدرجات غامقة ذكية (مثل رمادي داكن يذوب في العنابي الغامق `#750722` ثم الأسود) لمنع الشعور بالجمود أو التعتيم.
    *   استخدام هالات ضوئية متوهجة متحركة في الخلفية تنبض ببطء لإعطاء عمق بصري.
*   **الهوية الحيوية للفرق:**
    *   عرض شعارات الفرق داخل إطارات دائرية بيضاء مضيئة مع ظل مخصص لإبراز الهوية البصرية للأندية ومقاومة الخلفيات الغامقة.

---

## 8.2 التفاعلية الفائقة والوقت الفعلي (Real-Time & High Interactivity)

*   **كرت المباريات المباشرة المتوهج (Live Match Glow):**
    *   المباريات الجارية حالياً (`status: "live"`) ستحصل على **إطار أحمر متوهج ينبض ديناميكياً** (Pulse Glow Border) يجذب انتباه المستخدم فور دخوله للموقع.
    *   إرفاق مؤشر مباشر نابض (`live-indicator`) يعكس حيوية وتحديث المباراة بالثانية.
*   **تحديثات النتائج اللحظية (SSE Visual Feedback):**
    *   عند استقبال تحديث مباشر للأهداف عبر Server-Sent Events، لن تتغير النتيجة بصمت بل سيحدث **وميض لوني أخضر/ذهبي ناعم (Score Flash)** للرقم المتغير مع حركة تكبير وتصغير سريعة لجذب النظر.
*   **تصفيات فورية سريعة (Category Chips):**
    *   استبدال قوائم التصفية التقليدية بأزرار دائرية جذابة وأنيقة (Chips) تعلو الجداول (مثال: 🔴 مباشر | 📅 القادمة | 🏁 المنتهية) مع تنقل فوري وانتقال حركي انسيابي خفيف بين الحالات.
*   **جدول الترتيب التفاعلي (Interactive Standings):**
    *   عند نقر المستخدم على اسم فريق في جدول الترتيب، يتم تسليط الضوء (Highlight) على جميع مباريات هذا الفريق وتلوين صفوفه لربط البيانات بصرياً.

---

## 8.3 تجربة الجوال المثالية (Touch & Mobile-First Optimization)

*   **شريط المباريات الأفقي القابل للسحب (Swipeable Match Carousel):**
    *   بدلاً من عرض مباريات اليوم الطويلة عمودياً والتي تتطلب تمريراً مملاً، سيتم تحويلها في الجوال إلى **شريط أفقي جذاب قابل للسحب باللمس** (Touch-friendly horizontal scroll) لعرض سريع وسلس.
*   **أزرار لمس صديقة للإصبع (Thumb-Friendly Tap Targets):**
    *   جعل مساحة أي عنصر قابل للنقر لا تقل عن `48px * 48px` مع تباعد ذكي لمنع النقرات الخاطئة أثناء التصفح السريع بالجوال.
*   **شريط التنقل السفلي الذكي (Floating Bottom Navigation Sheet):**
    *   إضافة قائمة سفلية عائمة ممشوقة للجوال (تمثل تصميم التطبيقات الأصيلة Native Apps) تتيح للمستخدم الانتقال بين (الرئيسية، المباريات، الترتيب، التصويت) بإبهامه بسهولة تامة وبأنيق حركي.
*   **تفاعلات اللمس الناعمة (Micro-haptic Feedback Simulation):**
    *   تأثيرات تصغير خفيفة جداً عند الضغط على الأزرار وكروت المباريات (`active:scale-[0.97]`) لإعطاء إحساس تفاعلي وفيزيائي حقيقي عند اللمس.

---

## 8.4 إعادة هيكلة معرض الأهداف والتصويت (Interactive Goals Gallery)

*   **مشغل فيديو الأهداف الفاخر (Cinema Preview Drawer):**
    *   عند النقر على هدف لمشاهدته، ينبثق مشغل فيديو مخصص من الأسفل (Bottom Drawer) بتأثير خلفية معتمة بالكامل ونظام إضاءة سينمائي، يعرض بيانات الهدف واللاعب بشكل رائع.
*   **الرسم البياني للتصويت التفاعلي (Animated Voting Progress):**
    *   عند إدلاء المستخدم بصوته، تختفي أزرار التصويت بسلاسة عبر أنيميشن تدرجي، وتتحول النسب المئوية للأهداف إلى **أشرطة تقدم ملونة متحركة تتسع تدريجياً** لتمنح شعوراً بالإنجاز والمشاركة الفورية.

---

## المرحلة 6: إعادة الهيكلة البصرية والتفاعلية الحديثة (Design & Overhaul)

- [ ] **تحسين المظهر العام وخلفيات الصفحات:**
    *   [ ] إعداد التدرجات اللونية الرياضية المتدفقة في الخلفية وتثبيت الهالات الضوئية.
    *   [ ] إعداد شريط التنقل السفلي المخصص للجوال (Floating Bottom Nav).
- [ ] **إعادة تصميم كروت وجدول المباريات:**
    *   [ ] بناء مكون `MatchCarousel` الأفقي القابل للسحب على الجوال.
    *   [ ] تطبيق تأثير التوهج النابض (Pulse Border Glow) للمباريات المباشرة.
    *   [ ] إضافة تأثير الوميض الحركي (Score Flash) عند استقبال أهداف جديدة بالوقت الفعلي.
- [ ] **تطوير التفاعلية في جدول الترتيب والهدافين:**
    *   [ ] تطبيق تأثير تسليط الضوء التفاعلي (Interactive Highlighting) للفرق.
    *   [ ] إضافة رقاقات التصفية الفورية (Animated Category Chips).
- [ ] **تحديث معرض التصويت:**
    *   [ ] بناء لوحة عرض الأهداف السينمائية المنبثقة من الأسفل (Bottom Drawer / Sheet).
    *   [ ] برمجة أشرطة تقدم التصويت المتحركة والانتقالات السلسة بعد التصويت.

---
---


> [!NOTE]
> **هذه الوثيقة هي المرجع الوحيد والشامل للمشروع.** تحتوي كل قرار معماري، كل ملف ومكان وجوده، كل خوارزمية وكل مهمة مطلوبة. يمكن البدء بالتنفيذ مباشرة من المرحلة الأولى.
