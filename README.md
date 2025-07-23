# Blueprint: Medical Image Analysis Platform

Welcome to the Medical Image Analysis Platform! A comprehensive blueprint for building AI Medical web app. Designed to embody the architectural patterns and best practices required for sensitive domains like healthcare.

## Core Architecture & Philosophy

This project is built on a foundation of clean separation of concerns and robust, asynchronous communication.

-   **Backend First, Async Native:** A high-performance **FastAPI** backend handles all heavy lifting, from secure file uploads to AI model processing. Its asynchronous nature is key to our non-blocking design.
-   **Interactive & Reactive Frontend:** A **Next.js (React)** frontend provides a seamless user experience. We leverage **TypeScript** for strict type-safety and **TanStack Query** for intelligent state management.
-   **Real-Time is a Requirement:** We don't rely on simple polling. A persistent **WebSocket** connection provides instant feedback from the server to the client, creating a truly reactive experience.
-   **Database Done Right:** Using **SQLAlchemy 2.0** in its `async` mode, the database schema is designed for scalability and compliance, supporting features like AI model versioning and audit trails.
-   **Ready for Production:** The entire application is containerized with **Docker**, with deployment configurations for modern cloud platforms like Railway and Netlify ready to go (i'm broke so I use free tiers for the demo but we can move it too a true deployment solution like AWS / Azure or custom VPS pipeline :D)

---


#### **Architecture Patterns**
*   **Service & Repository Layers**: We strictly separate business logic (`services`) from data access (`models`), making the code cleaner, easier to test, and more maintainable.
*   **Observer Pattern**: Our WebSocket implementation is a classic example. The frontend "observes" the backend, which pushes state changes (`PENDING`, `COMPLETE`) as they happen.
*   **Middleware Pattern**: Used for cross-cutting concerns like security. Our audit logging middleware intercepts every request, ensuring compliance without cluttering our business logic.

#### **Performance & Scalability**
*   **Non-Blocking I/O**: From the `async` database drivers to `aiofiles` for file storage, no operation blocks the server's event loop.
*   **Horizontal Scaling**: The FastAPI backend is stateless, meaning you can spin up multiple instances behind a load balancer to handle increased traffic.
*   **Frontend Performance**: Next.js provides automatic code-splitting, while React Query prevents unnecessary data re-fetching, keeping the UI fast and responsive.
*   **3D Visualization Strategy**: The `MedicalScanViewer` component is designed with performance in mind, acknowledging the need for WebGL, Level of Detail (LOD), and Web Workers to handle large medical scans without crashing the browser.

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker

### Local Development

1. **Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

2. **Frontend Setup:**
```bash
cd frontend
npm install
npm run generate-api # If you change the backend API, regenerate the client to keep it in sync
npm run dev
```

3. **Docker Setup (Alternative):**
```bash
docker-compose up --build
```

# Development workflow commands on Windows
- Use the provided `dev.ps1` PowerShell script to manage your development workflow.

# Set execution policy (one time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Use the script
.\dev.ps1 help
.\dev.ps1 start    # Build and start everything
.\dev.ps1 logs
.\dev.ps1 shell
.\dev.ps1 down

### Deployment

#### Backend Deployment (Railway - Free Tier)
1. Connect your GitHub repo to Railway
2. Add environment variables:
   - `DATABASE_URL` (Railway will provide PostgreSQL)
   - `CORS_ORIGINS` (your Netlify domain)
3. Railway auto-deploys on push

#### Frontend Deployment (Netlify)
1. Connect GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` (your Railway backend URL)
   - `NEXT_PUBLIC_WS_URL` (WebSocket endpoint)

## Technical Interview Talking Points

### Architecture Patterns Demonstrated:
- **Repository Pattern**: Clean data layer separation
- **Service Layer**: Business logic encapsulation  
- **Observer Pattern**: WebSocket event handling
- **Factory Pattern**: Database session management
- **Middleware Pattern**: Cross-cutting concerns (logging, CORS)

### Performance Optimizations:
- **Database**: Async SQLAlchemy with connection pooling
- **Frontend**: React Query caching, code splitting
- **Real-time**: WebSocket connection management
- **3D Rendering**: GPU acceleration, LOD strategies

### Scalability Considerations:
- **Horizontal Scaling**: Stateless API design
- **Caching**: Redis-ready architecture
- **File Storage**: S3-compatible interface
- **Database**: Migration-based schema evolution
- **Monitoring**: Structured logging for observability

## Mock ML Pipeline

The AI analysis is currently mocked with:
- Realistic processing time (30-60 seconds)
- Status progression (PENDING → ANALYZING → COMPLETE)
- Confidence scores and structured results
- Error simulation for robustness testing

To integrate real ML:
1. Replace `mock_ai_analysis()` in `analysis_service.py`
2. Add model loading and inference code
3. Update result schemas for actual model outputs
4. Add GPU/CPU resource management

## Demo Features

- ✅ File upload with progress tracking
- ✅ Real-time processing status via WebSocket
- ✅ 3D visualization placeholder
- ✅ Responsive design with Tailwind CSS
- ✅ Type-safe API communication
- ✅ Error handling and user feedback
- ✅ Audit logging for security compliance
- ✅ Docker containerization
- ✅ Production deployment configs