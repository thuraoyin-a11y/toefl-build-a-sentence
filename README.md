# TOEFL Build a Sentence

Interactive TOEFL "Build a Sentence" practice platform with teacher-student workflow.

## Overview

This is a Next.js 14 full-stack application for TOEFL sentence-building practice. Teachers create practice content, assign it to students, and monitor progress. Students complete drag-and-drop sentence construction exercises with immediate feedback.

## Features

- **Sentence Building Practice**: Drag-and-drop sentence construction with immediate feedback
- **Teacher Management**: Content creation, student management, assignment tracking
- **Student Practice**: Assigned practice sets with progress tracking and retry functionality
- **Multi-role Auth**: Session-based authentication with teacher/student role separation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | SQLite + Prisma ORM |
| Auth | iron-session |
| Styling | Tailwind CSS |
| State | Zustand |

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/toefl-sentence-builder.git
cd toefl-sentence-builder/my-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and set SESSION_SECRET (required, min 32 chars)
```

4. Initialize the database:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Default Test Accounts

After running `npm run db:seed`, the following accounts are available:

| Email | Password | Role |
|-------|----------|------|
| teacher@example.com | password123 | Teacher |
| alex@example.com | password123 | Student |
| sam@example.com | password123 | Student |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
my-app/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (pages)/           # Page components
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Shared libraries
│   ├── auth/             # Authentication utilities
│   ├── teacher/          # Teacher-side utilities
│   └── prisma.ts         # Prisma client
├── prisma/                # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── store/                 # Zustand stores
└── data/mock/            # Mock/demo data
```

## Database Schema

```
User → Teacher/Student (1:1)
Teacher → Students/PracticeSets/Topics/SampleItems/Assignments (1:N)
Student → Assignments/PracticeAttempts (1:N)
```

Key models: User, Teacher, Student, PracticeSet, Topic, SampleItem, Assignment, PracticeAttempt

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string |
| `SESSION_SECRET` | Yes | Session encryption key (min 32 chars) |
| `NODE_ENV` | No | development or production |

## Deployment

### Important: Session Secret

The application **requires** `SESSION_SECRET` to be set. If not set, the application will throw an error on startup:

```
SESSION_SECRET environment variable is required. Please set a secure random string of at least 32 characters.
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Platform-specific Notes

- **Vercel**: Set `SESSION_SECRET` in Environment Variables
- **Railway**: Set `SESSION_SECRET` in Variables
- **Docker**: Pass via `-e SESSION_SECRET=...`

## License

MIT
