# Phase 2 — Student Management Plan

> Status: Planning Complete  
> Context: Post-Phase 1B (Auth Foundation Complete)

---

## 1. Exact Phase 2 Scope

### IN Scope
1. **Teacher Student List Page** (`/teacher/students`)
   - View all students managed by the logged-in teacher
   - Display student status (active/inactive), name, email, daily goal
   - Sort/filter by status and name

2. **Add Student Flow**
   - Modal or dedicated page for adding new students
   - Create both User and Student records atomically
   - Auto-generate initial password
   - Validate email uniqueness

3. **Student Activation/Deactivation**
   - Toggle student active status
   - Deactivated students cannot log in
   - Preserves all historical data

4. **Minimal Student Detail Page** (`/teacher/students/[id]`)
   - View student profile (name, email, daily goal, status)
   - Edit daily goal
   - Reset student password
   - Basic activity summary (assignment count, last active)

5. **Student Dashboard Access Boundaries**
   - Students can only see their own data
   - Students cannot access teacher routes
   - Middleware enforcement verified

### OUT of Scope (Phase 3+)
- Assignment creation/management UI
- Topic/category system
- Sample item workflow
- Analytics expansion
- Data source redesign beyond Phase 2 needs
- Student self-registration
- Email notifications
- Password reset by email
- Bulk student import

---

## 2. Required Pages

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/teacher/students` | List all teacher's students | TEACHER only |
| `/teacher/students/add` | Add new student form | TEACHER only |
| `/teacher/students/[id]` | Student detail view | TEACHER only |
| `/student/profile` | Student self-view (optional, minimal) | STUDENT only |

### Page Structure
```
app/teacher/students/
├── page.tsx              # Student list (server component)
├── add/
│   └── page.tsx          # Add student form (server component)
└── [id]/
    └── page.tsx          # Student detail (server component)

components/teacher/students/
├── StudentListClient.tsx      # Interactive list with actions
├── AddStudentClient.tsx       # Add student form logic
├── StudentDetailClient.tsx    # Student detail interactions
└── StudentStatusToggle.tsx    # Activate/deactivate toggle
```

---

## 3. Required API Routes

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/teacher/students` | GET | List all students for teacher | TEACHER |
| `/api/teacher/students` | POST | Create new student | TEACHER |
| `/api/teacher/students/[id]` | GET | Get single student details | TEACHER |
| `/api/teacher/students/[id]` | PATCH | Update student (goal, status) | TEACHER |
| `/api/teacher/students/[id]/reset-password` | POST | Reset student password | TEACHER |
| `/api/student/me` | GET | Get current student profile | STUDENT |

### API Response Shapes

**GET /api/teacher/students**
```typescript
{
  students: Array<{
    id: string;
    userId: string;
    name: string;
    email: string;
    dailyGoal: number;
    isActive: boolean;  // derived from User or add to Student schema
    createdAt: string;
    assignmentCount: number;
    lastActiveAt: string | null;
  }>
}
```

**POST /api/teacher/students**
```typescript
// Request
{
  name: string;
  email: string;
  dailyGoal?: number;  // default: 10
}

// Response
{
  student: {
    id: string;
    name: string;
    email: string;
    temporaryPassword: string;  // shown once
  }
}
```

---

## 4. Required Schema Usage

### Current Schema (sufficient for Phase 2)

The existing schema supports Phase 2 requirements:

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String?
  role         UserRole
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  teacher Teacher?
  student Student?
}

model Student {
  id           String   @id @default(uuid())
  userId       String   @unique
  teacherId    String
  dailyGoal    Int      @default(10)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user     User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  teacher  Teacher      @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  assignments Assignment[]
  attempts   PracticeAttempt[]
}
```

### Schema Additions Needed

**Add `isActive` to Student model:**
```prisma
model Student {
  // ... existing fields ...
  isActive     Boolean  @default(true)  // NEW
  // ...
}
```

**Add `lastActiveAt` to Student model (optional for Phase 2):**
```prisma
model Student {
  // ... existing fields ...
  lastActiveAt DateTime?  // NEW - updated on each login
  // ...
}
```

**Migration required:**
```bash
npx prisma migrate dev --name add_student_status
```

---

## 5. Validation Rules for Adding Students

### Field Validations

| Field | Rules |
|-------|-------|
| `name` | Required, 2-50 characters, alphanumeric + spaces |
| `email` | Required, valid email format, unique across all users |
| `dailyGoal` | Optional, integer 1-50, default 10 |

### Business Rules

1. **Email Uniqueness**
   - Check against `User.email` before creation
   - Return 409 Conflict if email exists

2. **Teacher Scope**
   - New student is automatically linked to creating teacher
   - Teacher can only manage their own students

3. **Password Generation**
   - Generate secure random temporary password (12 chars)
   - Hash with bcrypt before storage
   - Return plain text only in creation response (shown once)
   - Student must change password on first login (optional Phase 2)

4. **Rate Limiting (future)**
   - Consider adding per-teacher student creation limits

### Error Responses

```typescript
// 400 Bad Request - validation error
{ error: "Name is required and must be 2-50 characters" }

// 409 Conflict - duplicate email
{ error: "A user with this email already exists" }

// 403 Forbidden - not teacher's student
{ error: "You do not have permission to manage this student" }
```

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Schema migration downtime** | Medium | Migration is additive only; no data loss risk |
| **Student isolation leaks** | High | Add integration tests; verify all API routes filter by teacherId |
| **Password generation security** | Medium | Use crypto.randomBytes; ensure temporary passwords are shown once |
| **Email collision edge cases** | Low | Unique constraint on User.email; handle race conditions gracefully |
| **UI/UX confusion** | Low | Clear visual distinction between active/inactive students |
| **Middleware bypass** | Medium | Verify all new teacher routes are added to middleware.ts teacherRoutes array |

### Security Checklist
- [ ] All `/api/teacher/*` routes verify TEACHER role
- [ ] All student queries filter by `teacherId`
- [ ] Students cannot access other students' data via ID manipulation
- [ ] Deactivated students rejected at login

---

## 7. Recommended First Coding Task

### Task: Create `/api/teacher/students` GET endpoint

**Why this first:**
1. It establishes the API pattern for Phase 2
2. It validates the schema works for listing
3. It enables immediate UI development
4. It tests the teacher isolation logic

**Implementation steps:**
1. Create `app/api/teacher/students/route.ts`
2. Implement GET handler with:
   - Session verification (TEACHER role)
   - Query students where `teacherId = session.teacherId`
   - Join with User for name/email
   - Count assignments per student
   - Return JSON response

**Verification:**
```bash
# Login as teacher
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"password123"}' \
  -c cookies.txt

# Get student list
curl http://localhost:3000/api/teacher/students \
  -b cookies.txt
```

**Expected output:**
```json
{
  "students": [
    {
      "id": "...",
      "name": "Alex Chen",
      "email": "alex@example.com",
      "dailyGoal": 10,
      "isActive": true,
      "assignmentCount": 2
    }
  ]
}
```

---

## Implementation Sequence

1. **Schema Update** - Add `isActive` to Student model, run migration
2. **API: List Students** - GET `/api/teacher/students`
3. **API: Create Student** - POST `/api/teacher/students`
4. **Page: Student List** - `/teacher/students` with table view
5. **Page: Add Student** - `/teacher/students/add` with form
6. **API: Update Student** - PATCH `/api/teacher/students/[id]`
7. **Component: Status Toggle** - Activate/deactivate button
8. **Page: Student Detail** - `/teacher/students/[id]` minimal view
9. **API: Reset Password** - POST reset endpoint
10. **Student Boundaries** - Verify student cannot access teacher data

---

## Success Criteria

- [ ] Teacher can view list of all their students
- [ ] Teacher can add new student with auto-generated password
- [ ] Teacher can activate/deactivate students
- [ ] Teacher can view student detail page
- [ ] Teacher can update student daily goal
- [ ] Teacher can reset student password
- [ ] Student can only access their own dashboard
- [ ] Deactivated students cannot log in
- [ ] All API routes enforce teacher isolation
- [ ] Build passes (`npm run build`)
