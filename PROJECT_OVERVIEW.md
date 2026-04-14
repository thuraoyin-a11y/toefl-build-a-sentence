# TOEFL Sentence Builder - Project Overview

> **Status**: CLOSED - All Phases Complete (2026-04-08)  
> **Type**: Next.js 14 Full-Stack Web Application  
> **Purpose**: Interactive TOEFL "Build a Sentence" practice platform with teacher-student workflow

---

## 1. Executive Summary

This is a **Next.js 14** full-stack application for TOEFL sentence-building practice. It supports a teacher-student workflow where teachers create practice content, assign it to students, and monitor progress.

### Core Features
- **Sentence Building Practice**: Drag-and-drop sentence construction with immediate feedback
- **Teacher Management**: Content creation, student management, assignment tracking
- **Student Practice**: Assigned practice sets with progress tracking and retry functionality
- **Multi-role Auth**: Session-based authentication with teacher/student role separation

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS + Apple Design System | UI styling |
| **Database** | SQLite + Prisma ORM | Data persistence |
| **Auth** | iron-session | Session management |
| **State** | Zustand | Client state management |
| **Icons** | Lucide React | Icon library |
| **Password Hashing** | bcryptjs | Secure password storage |

---

## 3. Project Structure

```
my-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/route.ts    # POST /api/auth/login
│   │   │   ├── logout/route.ts   # POST /api/auth/logout
│   │   │   └── me/route.ts       # GET /api/auth/me
│   │   ├── practice-sets/        # Practice set endpoints
│   │   ├── student/              # Student-only endpoints
│   │   │   ├── assignments/      # Student assignment APIs
│   │   │   └── attempts/         # Practice attempt APIs
│   │   └── teacher/              # Teacher-only endpoints
│   │       ├── assignments/      # Assignment management
│   │       ├── sample-items/     # SampleItem CRUD
│   │       ├── students/         # Student management
│   │       ├── topics/           # Topic organization
│   │       └── activity/         # Multi-student activity feed
│   ├── login/page.tsx            # Login page
│   ├── page.tsx                  # Student home page
│   ├── practice/[id]/            # Practice session page
│   ├── result/[id]/              # Result page
│   ├── retry/[id]/               # Retry wrong answers
│   ├── teacher/                  # Teacher section
│   │   ├── page.tsx              # Teacher config/home
│   │   ├── students/             # Student management
│   │   └── activity/             # Activity feed
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── layout/                   # Layout components
│   ├── practice/                 # Practice-specific components
│   └── ui/                       # UI components (Button, Card, etc.)
├── lib/                          # Shared libraries
│   ├── auth/                     # Auth utilities
│   │   ├── session.ts            # Session types & config
│   │   ├── password.ts           # Password hashing
│   │   └── user.ts               # User authentication
│   ├── teacher/                  # Teacher-side utilities
│   │   ├── types.ts              # Shared teacher types
│   │   ├── mappers.ts            # Data transformation
│   │   └── formatters.ts         # Display formatters
│   ├── types.ts                  # Core type definitions
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utility functions
├── store/                        # Zustand stores
│   └── userStore.ts              # User session state
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data
├── data/                         # Static/mock data
├── middleware.ts                 # Route protection middleware
└── tailwind.config.ts            # Tailwind configuration
```

---

## 4. Database Schema

### Entity Relationship Diagram

```
User (1) ──────── (0..1) Teacher (1) ────── (N) Student
                    │                        │
                    │                        │
                    ├── (N) PracticeSet ←────┤
                    │      │                 │
                    │      ├── (N) Assignment┘
                    │      │        │
                    │      │        └── (N) PracticeAttempt
                    │      │                 │
                    │      │                 └── (N) Retry Attempts
                    │      │
                    ├── (N) Topic
                    │      │
                    └── (N) SampleItem
```

### Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| `User` | Base user account | id, email, name, passwordHash, role |
| `Teacher` | Teacher profile | id, userId, relations to content |
| `Student` | Student profile | id, userId, teacherId, dailyGoal, isActive |
| `PracticeSet` | Collection of questions | id, teacherId, title, questions (JSON), difficulty, topicId |
| `Topic` | Content categorization | id, teacherId, name, description, sortOrder |
| `SampleItem` | Individual question | id, teacherId, topicId, title, context, wordBank, correctAnswer, isSelfReviewed |
| `Assignment` | Practice set assignment | id, teacherId, studentId, practiceSetId, assignedAt, dueDate, completed |
| `PracticeAttempt` | Student practice record | id, studentId, practiceSetId, assignmentId, score, answers (JSON), attemptType |

### Key Design Decisions
1. **JSON Arrays**: `PracticeSet.questions` stores SampleItem IDs as JSON array (not join table)
2. **Self-Reviewed Items**: SampleItems must be self-reviewed before use in PracticeSets
3. **Assignment Completion**: Tracked via `Assignment.completed` boolean, synced from frontend
4. **Attempt Chain**: `sourceAttemptId` links retry attempts to original attempts

---

## 5. Authentication System

### Session Data (Discriminated Union)

```typescript
type SessionData =
  | {
      isLoggedIn: true;
      userId: string;
      email: string;
      role: "TEACHER";
      teacherId: string;
      studentId?: never;  // Never present for teachers
    }
  | {
      isLoggedIn: true;
      userId: string;
      email: string;
      role: "STUDENT";
      studentId: string;
      teacherId?: never;  // Never present for students
    }
  | {
      isLoggedIn: false;
    };
```

### Middleware Protection

| Route Pattern | Access |
|---------------|--------|
| `/`, `/practice/*`, `/result/*`, `/retry/*` | Any authenticated user |
| `/teacher/*` | Teachers only |
| `/login` | Redirects logged-in users |
| `/api/*` | Not gated by middleware (handled in routes) |

### API Auth Pattern

```typescript
// Standard auth check in API routes
const session = await getIronSession<SessionData>(cookies(), sessionOptions);

if (!session.isLoggedIn) {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

if (session.role !== "TEACHER") {
  return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
}
```

---

## 6. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user, create session |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Get current user info |

### Student APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/assignments` | List student's assignments with practice sets |
| GET | `/api/student/assignments/:id` | Get single assignment |
| POST | `/api/student/assignments/:id/complete` | Mark assignment complete |
| GET | `/api/student/attempts` | List practice attempts |
| POST | `/api/student/attempts` | Create new attempt |
| GET | `/api/student/attempts/sync` | Sync localStorage with server |

### Teacher APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teacher/students` | List all students with aggregates |
| POST | `/api/teacher/students` | Create new student |
| GET | `/api/teacher/students/:id` | Get student detail |
| PATCH | `/api/teacher/students/:id` | Update student (activate/deactivate) |
| GET | `/api/teacher/students/:id/assignments` | Student assignment history |
| GET | `/api/teacher/students/:id/attempts` | Student attempt history |
| GET | `/api/teacher/students/:id/timeline` | Student activity timeline |
| GET | `/api/teacher/students/:id/progress` | Student progress aggregates |
| GET | `/api/teacher/assignments` | List teacher's assignments |
| POST | `/api/teacher/assignments` | Create assignment |
| DELETE | `/api/teacher/assignments/:id` | Delete assignment |
| GET | `/api/teacher/activity` | Multi-student activity feed |
| GET | `/api/teacher/topics` | List topics |
| POST | `/api/teacher/topics` | Create topic |
| PATCH | `/api/teacher/topics/:id` | Update topic |
| DELETE | `/api/teacher/topics/:id` | Delete topic |
| GET | `/api/teacher/sample-items` | List sample items |
| POST | `/api/teacher/sample-items` | Create sample item |
| GET | `/api/teacher/sample-items/:id` | Get sample item |
| PATCH | `/api/teacher/sample-items/:id` | Update sample item |
| DELETE | `/api/teacher/sample-items/:id` | Delete sample item |
| POST | `/api/teacher/sample-items/:id/review` | Mark as self-reviewed |
| POST | `/api/teacher/practice-sets` | Create practice set |
| GET | `/api/practice-sets/:id` | Get practice set (student/teacher) |

---

## 7. Frontend Architecture

### Page Structure

| Route | Role | Purpose |
|-------|------|---------|
| `/login` | Public | User authentication |
| `/` | Student | Home page with daily goal and assignments |
| `/practice/:id` | Student | Practice session (10 questions) |
| `/result/:id` | Student | Results with score and feedback |
| `/retry/:id` | Student | Retry wrong answers |
| `/teacher` | Teacher | Teacher config / sample item management |
| `/teacher/students` | Teacher | Student list with aggregates |
| `/teacher/students/:id` | Teacher | Student detail view |
| `/teacher/students/:id/assignments` | Teacher | Student assignment history |
| `/teacher/students/:id/attempts` | Teacher | Student attempt history |
| `/teacher/students/:id/timeline` | Teacher | Student activity timeline |
| `/teacher/activity` | Teacher | Multi-student activity feed |

### Key Components

```typescript
// Practice components
components/practice/SentenceBuilder.tsx      // Drag-and-drop sentence builder
components/practice/WordBank.tsx             // Draggable word tiles
components/practice/SystemFeedbackCard.tsx   // Feedback after submission

// UI components
components/ui/Button.tsx                     // Apple-style buttons
components/ui/Card.tsx                       // Card containers
components/ui/Badge.tsx                      // Status badges

// Layout components
components/layout/Container.tsx              // Page containers
components/layout/Navbar.tsx                 // Top navigation
```

### State Management

```typescript
// Zustand store for user state
store/userStore.ts
  - currentUser: User | null
  - setUser(user): Set current user
  - logout(): Clear user
  - fetchUser(): Fetch from /api/auth/me
```

---

## 8. Design System

### Apple-Inspired Theme

The UI follows Apple's design philosophy:
- **Colors**: Pure black (#000000), Light gray (#f5f5f7), Apple Blue (#0071e3)
- **Typography**: System fonts (SF Pro), tight letter-spacing, optical sizing
- **Components**: Pill-shaped buttons, subtle shadows, generous whitespace
- **Cards**: Light backgrounds (#f5f5f7), 8-12px border radius

### Tailwind Config

```typescript
// Key custom colors
colors: {
  apple: {
    blue: "#007AFF",
    "blue-hover": "#0056D6",
    gray: "#F5F5F7",
    "gray-dark": "#86868B",
    text: "#1D1D1F",
    "text-secondary": "#6E6E73",
    success: "#34C759",
    warning: "#FF9500",
  },
}
```

See `design.md` for complete design specifications.

---

## 9. Data Flow

### Teacher Workflow
1. Create SampleItems (questions with context, wordBank, correctAnswer)
2. Self-review SampleItems (mark as reviewed)
3. Create PracticeSet from reviewed SampleItems (JSON array of IDs)
4. Create Topic for organization (optional)
5. Assign PracticeSet to Student

### Student Workflow
1. View assignments on home page
2. Start practice session (10 questions)
3. Build sentences using drag-and-drop
4. Submit and receive immediate feedback
5. View results page
6. Optionally retry wrong answers
7. Assignment marked complete on first attempt

### Teacher Monitoring
1. View student list with aggregates
2. Drill into individual student detail
3. View assignment/attempt history
4. View activity timeline
5. View multi-student activity feed

---

## 10. Key Utilities

### Teacher-Side Types & Mappers

```typescript
// lib/teacher/types.ts
interface ActivityEvent { ... }
interface AssignmentResponse { ... }
interface AttemptResponse { ... }
interface StudentDetail { ... }

// lib/teacher/mappers.ts
mapAssignmentToResponse(assignment)     // Assignment -> API shape
mapAttemptToResponse(attempt)           // Attempt -> API shape
mapAssignmentToActivityEvent(assignment) // Assignment -> Activity
mapAttemptToActivityEvent(attempt)      // Attempt -> Activity
```

### Type Guards

```typescript
// lib/auth/session.ts
isTeacher(session): session is TEACHER role
isStudent(session): session is STUDENT role
```

---

## 11. Development Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma client

# Build
npm run build            # Production build
npm run start            # Start production server
```

---

## 12. Test Accounts

| Email | Password | Role |
|-------|----------|------|
| teacher@example.com | password123 | Teacher |
| alex@example.com | password123 | Student |
| sam@example.com | password123 | Student |

---

## 13. Known Limitations

1. **Result page static paths**: Pre-renders with mock paths; runtime uses real UUIDs
2. **Mock data remnants**: Present for backward compatibility but not used in real flows
3. **Password reset**: Not implemented
4. **Email verification**: Not implemented
5. **Student self-registration**: Not implemented (teacher-managed only)
6. **Analytics**: Basic only (no advanced dashboards)
7. **Export/sharing**: Not implemented

---

## 14. Future Enhancement Areas

- Password reset functionality
- Email verification
- Student self-registration
- Advanced analytics/dashboards
- Practice set management UI improvements
- Export/sharing features
- Mobile app

---

## 15. Critical Implementation Notes

### For AI Agents Working on This Codebase

1. **Always use shared Prisma client**: Import from `@/lib/prisma`, never create new instances

2. **Follow auth pattern**: Use `getIronSession` with discriminated union type, check `isLoggedIn` then `role`

3. **Teacher isolation**: All teacher queries must include `where: { teacherId: session.teacherId }`

4. **Date serialization**: Convert Date objects to ISO strings in API responses

5. **Use teacher mappers**: Import from `@/lib/teacher/mappers` for consistent data transformation

6. **Session type guards**: Use `isTeacher()` and `isStudent()` for type narrowing

7. **Apple design**: Follow `design.md` for UI consistency - tight typography, pill buttons, binary backgrounds

8. **Route protection**: API routes handle their own auth; middleware handles page routes

9. **Assignment completion**: Synced from frontend to database on attempt creation

10. **PracticeSet questions**: Stored as JSON array of SampleItem IDs, not join table

---

## 16. File References

| File | Purpose |
|------|---------|
| `current_state.md` | Current project status |
| `next_task.md` | Next task (closed) |
| `plan.md` | Implementation plans |
| `design.md` | Complete design system specs |
| `decision_log.md` | Architecture decisions |
| `open_bugs.md` | Known issues |
| `lib/auth/session.ts` | Session configuration |
| `lib/teacher/types.ts` | Shared teacher types |
| `lib/teacher/mappers.ts` | Data transformation |
| `prisma/schema.prisma` | Database schema |
| `middleware.ts` | Route protection |
