# Backend Interview Challenge - Task Management API

**Completed Solution for PearlThoughts Backend Developer Interview**

A robust offline-first task management API built as part of a technical interview challenge. This solution demonstrates expertise in REST API design, data synchronization, conflict resolution, and offline-first architecture.

## �� Challenge Overview

This project was completed as part of a backend developer interview process, showcasing:

- **REST API Design**: Clean, standardized endpoints with proper HTTP status codes
- **Offline-First Architecture**: Reliable task management without internet dependency
- **Data Synchronization**: Intelligent sync queue with conflict resolution
- **Error Handling**: Comprehensive error responses and retry logic
- **Code Quality**: TypeScript, testing, and clean architecture patterns

## ✅ Implementation Status

**All Requirements Completed:**
- ✅ Task CRUD operations (GET, POST, PUT, DELETE)
- ✅ Offline functionality with sync queue
- ✅ Conflict resolution using "last-write-wins" strategy
- ✅ Batch sync processing
- ✅ Error handling and retry logic
- ✅ Soft delete functionality
- ✅ Comprehensive test coverage (17/17 tests passing)
- ✅ TypeScript type safety
- ✅ Clean, maintainable code structure

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Soft delete task |
| POST | `/api/sync` | Trigger sync |
| GET | `/api/status` | Check sync status |
| GET | `/api/health` | Health check |

## 🛠️ Technical Implementation

### Architecture Decisions
- **SQLite3**: Lightweight, serverless database for simplicity
- **TypeScript**: Type safety and better developer experience
- **Express.js**: Minimal, flexible web framework
- **UUID**: Globally unique identifiers for tasks
- **Batch Processing**: Configurable sync batch sizes for performance

### Key Features Implemented
1. **Sync Queue Management**: Tracks pending operations with retry logic
2. **Conflict Resolution**: Timestamp-based "last-write-wins" strategy
3. **Error Handling**: Standardized error responses with timestamps
4. **Data Validation**: Input validation and type checking
5. **Testing**: Comprehensive unit and integration tests

## �� Performance & Scalability

- **Batch Sync**: Processes up to 50 items per batch (configurable)
- **Retry Logic**: Automatic retry for failed operations (max 3 attempts)
- **Memory Efficient**: SQLite3 for lightweight storage
- **Type Safe**: Full TypeScript coverage prevents runtime errors

## �� Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

**Test Coverage:**
- TaskService: 8 tests
- SyncService: 6 tests  
- Integration: 3 tests
- **Total: 17 tests passing**

## �� Deployment Ready

The solution is production-ready with:
- Environment variable configuration
- Health check endpoints
- Graceful error handling
- Database initialization
- Build optimization

## �� Code Quality

- **ESLint**: Zero linting errors
- **TypeScript**: Strict type checking enabled
- **Prettier**: Consistent code formatting
- **Clean Architecture**: Separation of concerns
- **Documentation**: Comprehensive inline comments

## 🎓 Learning Outcomes Demonstrated

This project showcases proficiency in:
- Modern JavaScript/TypeScript development
- RESTful API design principles
- Database design and management
- Offline-first application architecture
- Conflict resolution strategies
- Testing methodologies
- Error handling patterns
- Code organization and maintainability

## �� Original Challenge Requirements

✅ **Core Requirements Met:**
- Task Management API (all CRUD operations)
- Sync Functionality (queue management, batch processing)
- Data Model (all required fields implemented)
- Sync Queue (operation tracking, retry logic)
- Error Handling (network failures, meaningful messages)
- Conflict Resolution (last-write-wins strategy)
- Performance (batch processing, minimal queries)

## 🔧 Development Setup

```bash
# Clone repository
git clone https://github.com/dhruvgarg23/backend-interview-PearlThoughts_main.git

# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

## 📞 Contact

**Developer:** Dhruv Garg  
**Repository:** [GitHub](https://github.com/dhruvgarg23/backend-interview-PearlThoughts_main)  
**Challenge:** PearlThoughts Backend Developer Interview

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

```
