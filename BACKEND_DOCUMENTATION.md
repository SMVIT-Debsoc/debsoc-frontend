# Backend Documentation

## 1) Overview

This project uses Next.js App Router APIs under `app/api` as the backend layer.

Core backend stack:

- Next.js route handlers (`app/api/**/route.ts`)
- NextAuth (Google OAuth only) with Prisma adapter
- Prisma ORM with PostgreSQL
- Role-based access control with session guards

Backend route file count: **45 route handlers**.

## 2) Architecture

### Runtime flow

1. Client calls `/api/*` route handlers.
2. Route handlers enforce authorization through `requireSessionUser(...)` where needed.
3. Routes execute Prisma queries directly or call service methods in `lib/server/debsoc-service.ts`.
4. Responses are standardized via `ok(...)` and `error(...)` helpers from `lib/server/http.ts`.

### Key backend files

- `auth.ts`: NextAuth config and callbacks
- `lib/server/guards.ts`: auth + role + verification guard
- `lib/server/http.ts`: JSON response helpers and body parsing helper
- `lib/server/prisma.ts`: Prisma singleton + PostgreSQL adapter pool
- `lib/server/auth-models.ts`: role user lookup/auth utilities
- `lib/server/debsoc-service.ts`: registration/verification/admin service logic
- `prisma/schema.prisma`: database schema

## 3) Authentication and Authorization

### Authentication model

- OAuth provider: Google only (via NextAuth).
- Session strategy: `database`.
- Password login routes exist but intentionally return `410` (disabled).

### NextAuth behavior (`auth.ts`)

- `signIn` callback:
    - allows sign-in only if provider is Google and email exists in one of the role tables.
- `session` callback:
    - enriches session user with:
        - `id`
        - `role`
        - `isVerified`
        - `name`
        - `email`

### Guard behavior (`requireSessionUser`)

`requireSessionUser({ roles?, requireVerified? })`:

- returns `401` if no valid session user
- returns `403` if role not allowed
- returns `403` if `requireVerified: true` and user is not verified (except TechHead)
- returns session user object on success

### Role set

- `TechHead`
- `President`
- `cabinet`
- `Member`

## 4) Environment Variables

Used by backend code:

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_SHEETS_WEBHOOK_URL` (optional applicants forward webhook)
- `NODE_ENV`

## 5) Data Model (Prisma)

## Domain models

1. `TechHead`

- unique email, password
- verifies President/cabinet/Member entities

2. `President`

- unique email, password
- `isVerified` + `verifiedByTechHeadId`
- receives anonymous messages
- can send anonymous feedback

3. `cabinet`

- unique email, password, position
- `isVerified` + `verifiedByTechHeadId`
- can be assigned tasks, mark attendance, send messages/feedback

4. `Member`

- unique email, password
- `isVerified` + `verifiedByTechHeadId`
- can be assigned tasks, attendance, receive feedback

5. `DebateSession` (mapped to DB table `Session`)

- session metadata (`sessionDate`, `motiontype`, `Chair`)

6. `Attendance`

- linked to session
- linked optionally to `Member` or `cabinet`
- stores `status` and optional `speakerScore`

7. `task`

- assignable to either cabinet or member
- stores `deadline` and task content

8. `AnonymousMessage`

- message to President
- sender can be Member or cabinet
- includes `senderType`

9. `AnonymousFeedback`

- feedback to Member
- sender can be cabinet or President
- includes `senderType`

## NextAuth adapter models

10. `User` (`auth_users`)
11. `Account` (`auth_accounts`)
12. `Session` (`auth_sessions`)
13. `VerificationToken` (`auth_verification_tokens`)

## 6) Backend Service Layer

`lib/server/debsoc-service.ts` provides:

- `registerRole(role, input)`
- `loginRole(role, input)` (not used by active API auth flow)
- `verifyEntity(entity, entityId, techHeadId)`
- `unverifyEntity(entity, entityId)`
- `deleteEntity(entity, id)`
- `getUnverifiedUsers()`
- `getVerifiedUsers()`

`lib/server/auth-models.ts` provides:

- role-specific lookup and password verification helpers
- `findRoleUserByEmail(email)` used by NextAuth callbacks

## 7) Response Helpers and Conventions

- `ok(data, init?)` -> JSON success response.
- `error(message, status, extra?)` -> JSON error format.
- `parseJson<T>(request)` -> typed request body parsing.

Common status codes in this backend:

- `200` success reads/default
- `201` created actions
- `400` validation/business errors
- `401` unauthenticated
- `403` unauthorized or unverified
- `404` not found (for session lookup during attendance mark)
- `410` password login disabled routes
- `500` webhook forwarding/internal errors in applicants route

## 8) Complete API Endpoint Catalog (45)

## A) Base and Auth

### 1. `GET /api`

- Auth: Public
- Request: none
- Response: `{ message, version }`
- Side effects: none

### 2. `POST /api/applicants`

- Auth: Public
- Request body: arbitrary JSON payload
- Behavior:
    - if `GOOGLE_SHEETS_WEBHOOK_URL` missing: accepts payload and returns success message
    - else forwards payload to configured webhook
- Response:
    - success: `{ success: true, message }`
    - failure: error response
- Non-200 status: `500`
- Side effects: external POST webhook call

### 3. `GET/POST /api/auth/[...nextauth]`

- Auth: NextAuth handler
- Request/response: managed by NextAuth internals
- Side effects: session/account persistence in auth tables

## B) Leaderboard

### 4. `GET /api/leaderboard`

- Auth: `Member | cabinet | President | TechHead` (verification not required in guard)
- Query params:
    - `type=bi-monthly` -> filters attendance to recent 60 days
- Response: `{ leaderboard: [{ id, name, type, score, sessions, rank }] }`
- Non-200 status: `401`, `403`
- DB ops:
    - reads members + cabinet + attendance records
    - computes aggregate score in route

## C) Member APIs

### 5. `POST /api/member/register`

- Auth: Public
- Request body: `{ name, email, password }`
- Response: `{ message, user: { id, name, email, role, isVerified } }`
- Non-200 status: `400`
- Success status: `201`
- Side effects: create Member, hashed password

### 6. `POST /api/member/login`

- Auth: Public
- Behavior: disabled
- Response: error message
- Non-200 status: `410`
- Side effects: none

### 7. `GET /api/member/attendance`

- Auth: `Member`, verified required
- Request: none
- Response: `{ attendance: [{ id, status, speakerScore, session }] }`
- Non-200 status: `401`, `403`
- Side effects: none

### 8. `GET /api/member/tasks`

- Auth: `Member`, verified required
- Request: none
- Response: `{ tasks: [...] }` (member-assigned tasks)
- Non-200 status: `401`, `403`
- Side effects: none

### 9. `GET /api/member/feedback`

- Auth: `Member`, verified required
- Request: none
- Response: `{ feedbacks: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

### 10. `POST /api/member/messages/president`

- Auth: `Member`, verified required
- Request body: `{ message, presidentId }`
- Response: `{ message, data }`
- Non-200 status: `400`, `401`, `403`
- Success status: `201`
- Side effects: create anonymous message record

### 11. `GET /api/member/messages/sent`

- Auth: `Member`, verified required
- Request: none
- Response: `{ messages: [...] }` (includes president details)
- Non-200 status: `401`, `403`
- Side effects: none

### 12. `GET /api/member/presidents`

- Auth: `Member`, verified required
- Request: none
- Response: `{ presidents: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

## D) Cabinet APIs

### 13. `POST /api/cabinet/register`

- Auth: Public
- Request body: `{ name, email, password, position }`
- Response: `{ message, user: { id, name, email, role, isVerified } }`
- Non-200 status: `400`
- Success status: `201`
- Side effects: create cabinet user, hashed password

### 14. `POST /api/cabinet/login`

- Auth: Public
- Behavior: disabled
- Response: error message
- Non-200 status: `410`
- Side effects: none

### 15. `GET /api/cabinet/dashboard`

- Auth: `cabinet | President`, verified required
- Request: none
- Response: `{ members, cabinet, presidents }`
- Non-200 status: `401`, `403`
- Side effects: none

### 16. `POST /api/cabinet/session/create`

- Auth: `cabinet | President`, verified required
- Request body: `{ sessionDate, motiontype, Chair }`
- Validation: ISO date validation for `sessionDate`
- Response: `{ message, session }`
- Non-200 status: `400`, `401`, `403`
- Success status: `201`
- Side effects: create debate session

### 17. `GET /api/cabinet/sessions`

- Auth: `cabinet | President`, verified required
- Request: none
- Response: `{ sessions: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

### 18. `POST /api/cabinet/attendance/mark`

- Auth: `cabinet | President`, verified required
- Request body:
    - `{ sessionId, attendanceData: [{ memberId? | cabinetId?, status, speakerScore? }] }`
- Validation:
    - session exists
    - exactly one of `memberId` or `cabinetId`
    - status in allowed values
    - speakerScore numeric if provided
- Response: `{ message, count }`
- Non-200 status: `400`, `404`, `401`, `403`
- Success status: `201`
- Side effects: bulk attendance insert transaction

### 19. `GET /api/cabinet/attendance/my`

- Auth: `cabinet`, verified required
- Request: none
- Response: `{ attendance: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

### 20. `POST /api/cabinet/feedback/give`

- Auth: `cabinet`, verified required
- Request body: `{ feedback, memberId }`
- Response: `{ message, feedback }`
- Non-200 status: `400`, `401`, `403`
- Success status: `201`
- Side effects: create anonymous feedback

### 21. `GET /api/cabinet/feedback/sent`

- Auth: `cabinet | President`, verified required
- Request: none
- Response: `{ feedbacks: [...] }`
- Behavior: cabinet sees own sent feedback; president role branch may fetch broader set
- Non-200 status: `401`, `403`
- Side effects: none

### 22. `POST /api/cabinet/messages/president`

- Auth: `cabinet`, verified required
- Request body: `{ message, presidentId }`
- Response: `{ message, data }`
- Non-200 status: `400`, `401`, `403`
- Success status: `201`
- Side effects: create anonymous message

### 23. `GET /api/cabinet/messages/sent`

- Auth: `cabinet | President`, verified required
- Request: none
- Response: `{ messages: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

### 24. `GET /api/cabinet/tasks`

- Auth: `cabinet | President`, verified required
- Request: none
- Response: `{ tasks: [...] }`
- Behavior: cabinet sees own assigned tasks; president branch can read broader tasks
- Non-200 status: `401`, `403`
- Side effects: none

## E) President APIs

### 25. `POST /api/president/register`

- Auth: Public
- Request body: `{ name, email, password }`
- Response: `{ message, user: { id, name, email, role, isVerified } }`
- Non-200 status: `400`
- Success status: `201`
- Side effects: create President with hashed password

### 26. `POST /api/president/login`

- Auth: Public
- Behavior: disabled
- Response: error message
- Non-200 status: `410`
- Side effects: none

### 27. `GET /api/president/dashboard`

- Auth: `President`, verified required
- Request: none
- Response: `{ members, cabinet }`
- Non-200 status: `401`, `403`
- Side effects: none

### 28. `GET /api/president/sessions`

- Auth: `President`, verified required
- Request: none
- Response: `{ sessions: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

### 29. `GET /api/president/tasks`

- Auth: `President`, verified required
- Request: none
- Response: `{ tasks: [...] }` with assignee relation data
- Non-200 status: `401`, `403`
- Side effects: none

### 30. `POST /api/president/tasks/assign`

- Auth: `President`, verified required
- Request body:
    - `{ name, description, deadline, assignedToId?, assignedToMemberId? }`
- Validation:
    - required `name`, `description`, `deadline`
    - at least one assignee target
- Response: `{ message, task }`
- Non-200 status: `400`, `401`, `403`
- Success status: `201`
- Side effects: create task

### 31. `POST /api/president/feedback/give`

- Auth: `President`, verified required
- Request body: `{ feedback, memberId }`
- Response: `{ message, feedback }`
- Non-200 status: `400`, `401`, `403`
- Success status: `201`
- Side effects: create anonymous feedback

### 32. `GET /api/president/feedback/sent`

- Auth: `President`, verified required
- Request: none
- Response: `{ feedbacks: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

### 33. `GET /api/president/messages`

- Auth: `President`, verified required
- Request: none
- Response: `{ messages: [...] }`
- Non-200 status: `401`, `403`
- Side effects: none

## F) TechHead APIs

### 34. `POST /api/techhead/login`

- Auth: Public
- Behavior: disabled
- Response: error message
- Non-200 status: `410`
- Side effects: none

### 35. `GET /api/techhead/unverified-users`

- Auth: `TechHead`
- Request: none
- Response: `{ unverifiedPresidents, unverifiedCabinet, unverifiedMembers }`
- Non-200 status: `401`, `403`
- Side effects: none

### 36. `GET /api/techhead/verified-users`

- Auth: `TechHead`
- Request: none
- Response: `{ verifiedPresidents, verifiedCabinet, verifiedMembers }`
- Non-200 status: `401`, `403`
- Side effects: none

### 37. `POST /api/techhead/verify/president`

- Auth: `TechHead`
- Request body: `{ presidentId }`
- Response: `{ message, president: { id, name, isVerified } }`
- Non-200 status: `400`, `401`, `403`
- Success status: `200`
- Side effects: set verified true + set verifier id

### 38. `POST /api/techhead/verify/cabinet`

- Auth: `TechHead`
- Request body: `{ cabinetId }`
- Response: `{ message, cabinet: { id, name, isVerified } }`
- Non-200 status: `400`, `401`, `403`
- Success status: `200`
- Side effects: set verified true + set verifier id

### 39. `POST /api/techhead/verify/member`

- Auth: `TechHead`
- Request body: `{ memberId }`
- Response: `{ message, member: { id, name, isVerified } }`
- Non-200 status: `400`, `401`, `403`
- Success status: `200`
- Side effects: set verified true + set verifier id

### 40. `POST /api/techhead/unverify/president`

- Auth: `TechHead`
- Request body: `{ presidentId }`
- Response: `{ message, president: { id, name, isVerified } }`
- Non-200 status: `400`, `401`, `403`
- Side effects: set verified false + clear verifier id

### 41. `POST /api/techhead/unverify/cabinet`

- Auth: `TechHead`
- Request body: `{ cabinetId }`
- Response: `{ message, cabinet: { id, name, isVerified } }`
- Non-200 status: `400`, `401`, `403`
- Side effects: set verified false + clear verifier id

### 42. `POST /api/techhead/unverify/member`

- Auth: `TechHead`
- Request body: `{ memberId }`
- Response: `{ message, member: { id, name, isVerified } }`
- Non-200 status: `400`, `401`, `403`
- Side effects: set verified false + clear verifier id

### 43. `DELETE /api/techhead/delete/president`

- Auth: `TechHead`
- Request body: `{ id }`
- Response: `{ message }`
- Non-200 status: `400`, `401`, `403`
- Side effects: delete President record

### 44. `DELETE /api/techhead/delete/cabinet`

- Auth: `TechHead`
- Request body: `{ id }`
- Response: `{ message }`
- Non-200 status: `400`, `401`, `403`
- Side effects: delete cabinet record

### 45. `DELETE /api/techhead/delete/member`

- Auth: `TechHead`
- Request body: `{ id }`
- Response: `{ message }`
- Non-200 status: `400`, `401`, `403`
- Side effects: delete Member record

## 9) End-to-End Functional Flows

### Registration + Verification

1. Public registration (`/api/{member|cabinet|president}/register`).
2. Role user is created as `isVerified=false`.
3. TechHead reads pending users via `/api/techhead/unverified-users`.
4. TechHead verifies via `/api/techhead/verify/{role}`.
5. Verified users gain access to guarded endpoints requiring `requireVerified=true`.

### OAuth Login

1. User signs in via Google (NextAuth route).
2. `signIn` callback allows only emails found in role tables.
3. Session callback injects role + verification flags into session.
4. Protected routes use guard checks against those session fields.

### Session and Attendance

1. Cabinet/President creates debate sessions.
2. Cabinet/President marks attendance for members/cabinet.
3. Member/cabinet view own attendance.
4. Leaderboard aggregates present attendance scores.

### Tasks

1. President assigns tasks to cabinet/member.
2. President can list all tasks.
3. Member and cabinet read their own assigned tasks via role-filtered routes.

### Anonymous Messaging/Feedback

- Member/cabinet can send anonymous messages to a president.
- President reads received messages.
- Cabinet/president can send anonymous feedback to members.
- Member reads received feedback.

## 10) Observed Design Characteristics

- Password login API paths are intentionally deprecated (410) in favor of Google OAuth.
- Verification is role-gated and controlled by TechHead routes.
- Most write operations validate request body presence and fields inline in route handlers.
- Routes use a mix of direct Prisma calls and service-layer abstractions.

## 11) Maintenance Notes

When extending backend:

- keep role checks in `requireSessionUser`
- keep response shape consistent via `ok/error`
- update this document when adding/removing route handlers
- ensure Prisma schema + route-level validation remain aligned

---

Generated by inspecting backend source in this repository.
