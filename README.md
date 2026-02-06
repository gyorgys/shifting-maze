# Shifting Maze

A full-stack TypeScript application with Express.js backend and React frontend.

## Project Structure

- **server/** - Express.js backend API (TypeScript)
- **client/** - React frontend application (TypeScript + Vite)

## Setup Instructions

### Server Setup

```bash
cd server
npm install
npm run dev
```

The server will start on http://localhost:3001

### Client Setup

```bash
cd client
npm install
npm run dev
```

The client will start on http://localhost:5173

## API Endpoints

- `GET /api/home` - Returns a welcome message

## Technology Stack

### Backend
- Node.js
- Express.js
- TypeScript
- CORS

### Frontend
- React
- TypeScript
- Vite
- REST API

## Development

Both applications support hot-reload during development:
- Server uses `tsx` for fast TypeScript execution
- Client uses Vite's dev server with HMR
