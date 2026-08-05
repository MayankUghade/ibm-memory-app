# 🧠 Recall

> Never forget a conversation again.

Recall is an AI-powered people-memory app. Point your camera at someone, record a conversation, and the app automatically figures out who they are, transcribes what was said, and saves it all — so you always have context the next time you meet them.

No manual tagging. No typing. Just talk.

---

## ✨ What It Does

- **Record** — Point your camera at someone, hit record, and have a conversation. Recall captures their face and your audio simultaneously.
- **Recognize** — The next time you see them, open Scan mode. Recall identifies them in real time and shows you everything you need to remember.
- **Remember** — Every conversation is saved as an Encounter with a transcript, summary, topics, and the person's details.

---

## How It Works

```
Camera → Face Detected → Audio Recorded
                                ↓
                    Groq Whisper transcribes audio
                                ↓
                    Llama 3.3-70B extracts:
                    name · occupation · topics · summary
                                ↓
              Face embedding compared against saved people
                    ↙                         ↘
           Match found                    No match
       Add new Encounter              Create new Person
        to existing person             + first Encounter
```

Face recognition is handled entirely on-device using **face-api.js**, which generates a 128-dimensional embedding from each detected face. These embeddings are compared using Euclidean distance — no photos are stored server-side.

---

## Tech Stack

### Frontend
- **Next.js** (App Router) — React framework
- **TypeScript** — end-to-end type safety
- **Tailwind CSS** — styling
- **face-api.js** — in-browser face detection & recognition
- **Axios** — API client

### Backend
- **Express.js** — REST API server
- **TypeScript** — type safety
- **Prisma + PostgreSQL** — database ORM
- **Groq SDK** — Whisper (speech-to-text) + Llama (information extraction)
- **Multer** — audio file upload handling
- **JWT** — stateless authentication

---

## Project Structure

```
recall-frontend/
├── app/
│   ├── page.tsx                  # Root → redirects to dashboard
│   ├── layout.tsx
│   ├── globals.css
│   ├── components/
│   │   ├── Dashboard.tsx         # People list, grouped by recency
│   │   └── Navbar.tsx
│   └── camera/
│       ├── page.tsx              # Camera hub
│       ├── record/page.tsx       # Record a new conversation
│       ├── scan/page.tsx         # Live face recognition
│       └── person/[id]/page.tsx  # Person detail + encounter history
├── lib/
│   ├── api.ts                    # All API calls + TypeScript types
│   └── auth.ts                   # JWT helpers

recall-backend/
├── src/
│   ├── index.ts                  # Express app entry
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── people.routes.ts
│   │   └── encounter.routes.ts
│   ├── controllers/
│   │   ├── auth.controllers.ts
│   │   ├── people.controllers.ts
│   │   └── encounters.controllers.ts
│   ├── middleware/               # JWT auth middleware
│   ├── db/                       # Prisma client singleton
│   └── types/                    # Shared types (AuthRequest, etc.)
└── prisma/
    └── schema.prisma             # DB schema
```

---

## Database Schema

| Model | Key Fields |
|---|---|
| `User` | `id`, `username`, `email`, `password` |
| `Person` | `id`, `userId`, `name?`, `occupation?`, `faceEmbedding` (128-dim JSON), `createdAt` |
| `Encounter` | `id`, `personId`, `transcript?`, `summary?`, `topics?`, `date` |

A `Person` accumulates many `Encounters` over time — their full conversation history.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a new account |
| `POST` | `/auth/login` | Authenticate and receive a JWT |

### People
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/people` | ✅ | List all people with their most recent encounter |
| `GET` | `/api/people/:id` | — | Get a person's full profile and encounter history |
| `POST` | `/api/people/match` | ✅ | Match a face embedding against stored people |
| `DELETE` | `/api/people/:id` | ✅ | Delete a person and all their encounters |

### Encounters
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/encounters` | ✅ | Submit audio + face embedding → runs full AI pipeline → saves result |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- [Groq API key](https://console.groq.com)

### Backend

```bash
cd recall-backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, GROQ_API_KEY
npm install
npx prisma migrate dev
npm run dev            # runs on :8000
```

### Frontend

```bash
cd recall-frontend
cp .env.example .env   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev            # runs on :3000
```

> **face-api.js models** — Download the model weights and place them in `recall-frontend/public/models/`. Required models: `ssd_mobilenetv1`, `face_landmark_68`, `face_recognition`.

---

## Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
GROQ_API_KEY=gsk_...
PORT=8000
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Roadmap

- [ ] Photo capture and storage per person
- [ ] Location tagging on encounters
- [ ] Search across people and conversations
- [ ] Export / backup conversations
- [ ] Mobile app (React Native)

---

## License

MIT

# recall-frontend
