# API Migration Project Plan

Status Legend:
✅ Done | 🚧 In Progress | ⌛ Not Started | ❌ Blocked

## Phase 1: Database Updates
Status: ✅ Done
1. Add missing indexes ✅
   - Index on topics(user_id)
2. Rename users.role column to users.roles ✅
3. Document roles ✅
   - role_user: Default role for all users
   - role_admin: Required for /admin access
4. Verify all needed cascade deletes are in place ✅

## Phase 2: Authentication Setup
Status: 🚧 In Progress
1. Implement JWT authentication ✅
   - Token generation and validation
   - User registration endpoint
   - User login endpoint
   - /me endpoint
2. Add user management 🚧
   - Session handling ✅
   - Connection timeouts ✅
   - Error handling ✅
3. Set up auth middleware ✅
4. Add user session handling ✅
5. Define token storage strategy ✅
   - Using JWT in Authorization header

## Phase 3: Project Structure Setup
Status: ⌛ Not Started
1. Reorganize project into new structure by creating:
   - frontend/ directory: Move all current React code
   - backend/ directory: New Express/Node backend code
   - shared/ directory: Shared types and utilities
   - Root package.json for workspace management
2. Backend structure setup:
   - src/models: Database models
   - src/routes: API routes
   - src/db: Migrations
   - src/middleware: Auth, logging, etc.

## Phase 4: Backend Setup
Status: ⌛ Not Started
1. Initialize backend Express server
2. Move and adapt database code
3. Set up middleware:
   - CORS
   - Helmet security
   - Request logging
   - Error handling
   - Rate limiting
   - Define rate limiting strategy per endpoint

## Phase 5: API Implementation
Status: ⌛ Not Started
1. Define API versioning approach:
   - Use /api/v1 prefix for all endpoints
   - Document version header handling

### Endpoints

API Base Path: /api/v1

Auth:
- POST   /auth/register     - Register new user ✅
- POST   /auth/login        - Login user ✅
- POST   /auth/logout       - Logout user ⌛
- GET    /auth/me           - Get current user ✅

Users (Admin):
- GET    /users            - List users ⌛
- PUT    /users/:id        - Update user ⌛
- DELETE /users/:id        - Delete user ⌛

Topics:
- GET    /topics        - List topics ⌛
- POST   /topics        - Create topic (admin) ⌛
- GET    /topics/:id    - Get topic ⌛
- PUT    /topics/:id    - Update topic (admin) ⌛
- DELETE /topics/:id    - Delete topic + cascade (admin) ⌛

Questions:
- GET    /questions/topic/:id  - Get questions for topic ⌛
- POST   /questions           - Create question (admin) ⌛
- PUT    /questions/:id       - Update question (admin) ⌛

Progress:
- GET    /progress/topic/:id  - Get progress for topic ⌛
- POST   /progress           - Record progress ⌛

### Response Formats
1. Success Response Structure ✅
2. Error Response Codes and Formats 🚧
3. Pagination Format ⌛

## Phase 6: Frontend Updates
Status: ⌛ Not Started
1. Create API client service
2. Update components to use API
3. Implement error handling
4. Add loading states
5. Add authentication UI

## Phase 7: Future Enhancements
Status: ⌛ Not Started

### Development
1. Configure nodemon
2. Set up concurrent frontend/backend development
3. Configure debugging
4. Set up API documentation generation
5. Set up request validation
6. Configure production logging

### Features
1. Password reset functionality
2. Email verification
3. Sorting/Filtering for API endpoints
4. API versioning
5. Offline support
6. Error boundary handling
7. Request retry logic

### Database
1. Add audit fields (created_by, updated_by)
2. Database backup strategy

### Testing & Deployment
Status: 🚧 In Progress
1. End-to-end testing 🚧
2. Cross-browser testing ⌛
3. Load testing ⌛
4. Zero-downtime deployment ⌛
5. Monitoring setup ⌛
6. Error tracking setup ⌛
7. Backup strategy ⌛
8. Rollback procedures ⌛

## Testing Strategy
Status: 🚧 In Progress
1. Unit tests for API endpoints 🚧
   - Auth endpoints ✅
     - User registration (success/failure) ✅
     - User login (success/failure) ✅
     - Session management ✅
     - /me endpoint ✅
   - Topics endpoints ⌛
   - Questions endpoints ⌛
   - Progress endpoints ⌛
2. Integration tests for database operations 🚧
   - Auth operations ✅
   - Other operations ⌛
3. Authentication flow testing ✅
   - Registration flow ✅
   - Login flow ✅
   - Session validation ✅
4. Frontend integration testing ⌛

## Deployment Considerations
Status: ⌛ Not Started
1. Update build scripts
2. Environment variable management
3. Database migration process
4. API documentation deployment
