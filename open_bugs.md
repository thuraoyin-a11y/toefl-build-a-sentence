# Open Bugs

## Status

**ALL CLEAR — No blocking open bugs**

Last verification: 2026-04-09 (V2 Architecture)

---

## Bug Record Format

### BUG-XXX
- Title:
- Symptom:
- Reproduction:
- Affected Area:
- Priority:
- Current Status:
- Notes:

---

## Resolved Issues (Historical Record)

### BUG-001 — Student Home Assignment Display
- **Title:** Assigned practice sets not displaying on student home
- **Symptom:** Student home page showed "No practice sets assigned" even when assignments existed
- **Root Cause:** Mock practice set IDs (set001/set002/set003) didn't match database UUIDs from API
- **Fix:** Updated API to return full practiceSet object; updated UI to use real data
- **Status:** ✅ RESOLVED (2026-04-08)

### BUG-002 — Mock Data Dependencies in Student Flows
- **Title:** Student flows still depended on mock data and localStorage
- **Symptom:** Results and retry flows used localStorage fallback instead of database
- **Root Cause:** V1 architecture used mock data; V2 migration incomplete
- **Fix:** 
  - Removed all `@/data/mock` imports from TSX files
  - Updated ResultPageClient to fetch from API only
  - Updated RetryClient to load source attempt from API
  - Updated TeacherConfigClient to fetch attempts from API
  - Created `/api/teacher/attempts` endpoint
- **Status:** ✅ RESOLVED (2026-04-09)

---

## Accepted Non-Blocking Limitations

The following are known limitations that were accepted and did not block project closeout:

1. **Result page static paths**: Pre-renders with mock set001/set002/set003 paths; runtime uses real UUIDs
2. **Password reset**: Not implemented (teacher-managed temporary passwords)
3. **Email verification**: Not implemented
4. **Student self-registration**: Not implemented
5. **Analytics**: Limited to current history views
6. **Export/sharing**: Not implemented

---

## Current Bug Status

No confirmed open bugs. Project is CLOSED with V2 Architecture (mock data removed).
