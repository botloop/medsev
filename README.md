# Philippine Coast Guard Personnel Management System

A modern, secure personnel management system for the Philippine Coast Guard Medical Station Eastern Visayas.

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- React Router v6
- Material UI v7
- Recharts
- React Hook Form + Zod
- Axios
- Firebase SDK

**Backend:**
- Node.js with TypeScript
- Express.js
- Firebase Admin SDK
- JWT Authentication
- Multer (file uploads)
- Cloudinary (cloud file storage)
- Winston (logging)
- Zod (validation)

**Database & Storage:**
- Firebase Firestore
- Firebase Storage
- Firebase Authentication

## Project Structure

```
pcg-personnel-system/
├── client/          # React TypeScript frontend
├── server/          # Node.js TypeScript backend
├── shared/          # Shared types and constants
└── package.json     # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Firebase service account key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Setup environment variables:
   - Copy `client/.env.example` to `client/.env.local`
   - Copy `server/.env.example` to `server/.env`
   - Fill in your Firebase credentials

4. Start development servers:
   ```bash
   npm run dev
   ```

   This will start both the frontend (http://localhost:3000) and backend (http://localhost:5000).

### Development

- **Frontend only:** `npm run client`
- **Backend only:** `npm run server`
- **Both:** `npm run dev`

### Building for Production

```bash
npm run build
```

## Features

### Implemented
- ✅ Google Sign-In & Serial Number Authentication
- ✅ Personnel CRUD operations
- ✅ Search and filtering
- ✅ Analytics dashboard
- ✅ Activity logging
- ✅ Role-based access control
- ✅ Medical status tracking (8-step process)
- ✅ Clinical records with vitals, history, print & Rx
- ✅ BMI monitoring with trend chart
- ✅ Medical supplies inventory
- ✅ Calendar / activity scheduling
- ✅ Internal messaging / chat
- ✅ File uploads (medical result attachments)

### Planned
- Export functionality (CSV/Excel)
- Real-time updates (WebSocket)
- Batch operations

## Deployment

**Frontend:** Firebase Hosting
**Backend:** Google Cloud Run
**Database:** Firebase Firestore

## Security

- JWT-based authentication
- Firestore security rules
- Firebase Storage rules
- Input validation and sanitization
- CORS configuration
- Rate limiting

## License

Copyright © 2026 SN2 Acosta PCG
Philippine Coast Guard Medical Station Eastern Visayas

For official use only - Authorized personnel only per CG Security Directive 2025-01.

## Contact

**Medical Station Eastern Visayas**
Brgy 99 Diit Tacloban City, Leyte
📞 09934532670
📧 cgmedclev@gmail.com
