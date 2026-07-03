# FIXORA — AI-Powered Vehicle Complaint & Workshop Management Platform

FIXORA is a futuristic, highly animated, full-stack vehicle maintenance management platform built with a premium **Maximalism UI Design**. It integrates real-time AI fault prediction, voice transcription diagnostics, WebSocket-driven client-garage chat corridors, billing automation, and analytical admin maps.

---

## 🛠️ Technology Stack

### Frontend Client
* **Framework**: Next.js 15 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Animations**: Framer Motion & GSAP
* **API Utilities**: Axios & TanStack Query (React Query)
* **Themes**: Next Themes (Dark Mode by default)

### Backend API
* **Framework**: Python FastAPI
* **Database**: MongoDB (using Motor async engine)
* **Auth**: JWT Cryptography & password hashing (passlib/bcrypt)
* **Realtime Protocol**: WebSockets
* **AI Processing**: Gemini API (with robust heuristic NLP fallbacks)
* **Reports**: FPDF2 PDF & CSV data stream engines

---

## 📦 Project Structure

```bash
FIXORA/
├── backend/
│   ├── app/
│   │   ├── auth/            # JWT validation & role controls
│   │   ├── database/        # Async MongoDB Motor connection
│   │   ├── models/          # Schema definitions
│   │   ├── routers/         # REST API routers (auth, vehicles, complaints, chat, etc.)
│   │   ├── services/        # AI Service modules (Gemini integrations & fallbacks)
│   │   ├── utils/           # File uploads & notification dispatches
│   │   ├── websocket/       # WebSocket connection manager
│   │   └── main.py          # Server configuration & lifecycle events
│   ├── requirements.txt     # Python backend dependencies
│   ├── seed.py              # Synchronous MongoDB seeder
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app routes (owner, workshop, admin dashboards)
│   │   ├── components/      # Common UI elements & Providers wrapper
│   │   ├── hooks/           # useChat WebSocket connection hook
│   │   └── services/        # Axios API config
│   ├── tailwind.config.ts   # Maximalism neon styles and float keyframes
│   └── Dockerfile
│
└── docker-compose.yml       # Multi-service local orchestrations
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
1. **Node.js**: v18+
2. **Python**: v3.10+
3. **MongoDB**: Local server running on port `27017`

### 1. Backend Service Setup

Navigate to the `backend` folder:
```bash
cd backend
```

Create a virtual environment and install requirements:
```bash
python -m venv venv
# On Windows powershell:
.\venv\Scripts\Activate.ps1
# On MacOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Verify your local MongoDB server is running, and configure the `.env` settings:
```ini
MONGODB_URI=mongodb://127.0.0.1:27017
DATABASE_NAME=fixora
JWT_SECRET=4f7e2a9b3c5d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f
```

Execute the database seeder to populate mock vehicles, owners, complaints, and chats:
```bash
python seed.py
```

Run the FastAPI dev server:
```bash
uvicorn app.main:app --reload
```
* Backend API documentation (Swagger UI) is available at: **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

### 2. Frontend Client Setup

Navigate to the `frontend` folder:
```bash
cd ../frontend
```

Install packages and compile dependencies:
```bash
npm install --legacy-peer-deps
```

Start the Next.js development server:
```bash
npm run dev
```
* Frontend panel dashboard is accessible at: **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Demo Access Credentials

The database seeding script pre-populates three roles for testing out-of-the-box flows:

| Role | Username (Email) | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin@fixora.com` | `admin123` |
| **Vehicle Owner** | `owner@fixora.com` | `owner123` |
| **Workshop Mechanic** | `workshop@fixora.com` | `workshop123` |

---

## 🐳 Docker Container Execution

To compile and network the database, backend services, and next-themes client panels together:
```bash
docker-compose up --build
```
This runs:
* **MongoDB**: `localhost:27017`
* **FastAPI Backend**: `localhost:8000`
* **Next.js Client**: `localhost:3000`
