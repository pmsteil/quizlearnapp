# API Migration Project Plan

Status Legend:
✅ Done | 🚧 In Progress | ⌛ Not Started | ❌ Blocked | 🔜 Do This Next

## Phase 1: Database Updates
Status: ✅ Done
1. Add missing indexes ✅
   - Index on topics(user_id)
2. Rename users.role column to users.roles ✅
3. Document roles ✅
   - role_user: Default role for all users
   - role_admin: Required for /admin access
4. Verify all needed cascade deletes are in place ✅
5. Remove duplicate 'role' field from users table (use 'roles' field only) ✅
6. Document database schema in XML format ✅
7. Design AI agent user system 🔜
   - Create special user accounts for AI agents (lesson_teacher, lesson_plan)
   - Support for multiple teacher personalities:
     - Different teaching styles (e.g., Socratic, direct, encouraging)
     - Specialized subject matter experts
     - Various difficulty levels
   - Future agent types to consider:
     - study_buddy: Peer-like agent for collaborative learning
     - mentor: Long-term progress tracking and guidance
     - expert_reviewer: Specialized in giving detailed feedback
   - Each agent will have:
     - Unique user_id prefix (e.g., teacher_*, mentor_*)
     - Custom avatar/icon
     - Personality description
     - Specialized knowledge areas
     - Preferred teaching methods

## Phase 2: Authentication Setup
Status: ✅ Done
1. Implement JWT authentication ✅
   - Token generation and validation ✅
   - User registration endpoint ✅
   - User login endpoint ✅
   - /me endpoint ✅
2. Add user management ✅
   - Session handling ✅
   - Connection timeouts ✅
   - Error handling ✅
3. Set up auth middleware ✅
4. Add user session handling ✅
5. Define token storage strategy ✅
   - Using JWT in Authorization header

## Phase 3: Project Structure Setup
Status: ✅ Done
1. Reorganized project into new structure:
   - frontend/ directory: React frontend code
   - backend/ directory: FastAPI backend code
   - shared/ directory: Shared types and utilities
   - Root package.json for workspace management
2. Updated package.json files for each workspace
3. Moved code to appropriate directories
4. Set up shared types and utilities

## Phase 4: Backend Development
Status: ✅ Done
1. Initialize backend Express server ✅
2. Move and adapt database code ✅
3. Set up middleware: ✅
   - CORS ✅
   - Request logging ✅
   - Error handling ✅
   - Rate limiting ✅
   - Define rate limiting strategy per endpoint ✅

## Phase 5: API Implementation
Status: ✅ Done
1. Define API versioning approach: ✅
   - Use /api/v1 prefix for all endpoints ✅
   - Document version header handling ✅

### Endpoints

API Base Path: /api/v1

Auth:
- POST   /auth/register     - Register new user ✅
- POST   /auth/login        - Login user ✅
- POST   /auth/logout       - Logout user ✅
- GET    /auth/me           - Get current user ✅

Users (Admin):
- GET    /users            - List users ✅
- PUT    /users/:id        - Update user ✅
- DELETE /users/:id        - Delete user ✅

Topics:
- GET    /topics        - List topics ✅
- POST   /topics        - Create topic (admin) ✅
- GET    /topics/:id    - Get topic ✅
- PUT    /topics/:id    - Update topic (admin) ✅
- DELETE /topics/:id    - Delete topic + cascade (admin) ✅

Questions:
- GET    /questions/topic/:id  - Get questions for topic ✅
- POST   /questions           - Create question (admin) ✅
- PUT    /questions/:id       - Update question (admin) ✅

Progress:
- GET    /progress/topic/:id  - Get progress for topic ✅
- POST   /progress           - Record progress ✅

### Response Formats
1. Success Response Structure ✅
2. Error Response Codes and Formats ✅
3. Pagination Format ✅

## Phase 6: Frontend Development
Status: ✅ Done

### Infrastructure Setup
1. API Client Integration ✅
   - Create frontend/src/lib/api.ts ✅
   - Configure API client with environment variables ✅
   - Export service instances (auth, topics, questions, progress) ✅
   - Add request/response interceptors ✅
   - Add error handling middleware ✅

2. State Management ✅
   - Create AuthContext for user state ✅
   - Create LoadingContext for API states ✅
   - Add token management ✅
   - Add persistent login ✅
   - Add auto-refresh token logic ✅

3. Error Handling ✅
   - Create error handling utilities ✅
   - Create useAsync hook for API calls ✅
   - Add error boundary components ✅
   - Integrate toast notifications ✅
     - Toast context and hooks ✅
     - Toast container component ✅
     - Toast styling ✅
     - Integration with error handling ✅
   - Add API error type definitions ✅
   - Add error logging ✅

4. Environment Setup ✅
   - Configure frontend environment variables ✅
   - Add environment type definitions ✅
   - Set up environment switching (dev/test/prod) ✅
   - Add environment validation ✅
   - Create environment examples ✅

### Component Implementation
1. Create API client service ✅
   - Base client implementation ✅
   - Auth service ✅
   - Topics service ✅
   - Questions service ✅
   - Progress service ✅

2. Add validation schemas ✅
   - Auth validation ✅
   - Topics validation ✅
   - Questions validation ✅
   - Progress validation ✅

3. Create UI Components ✅
   - Progress component ✅
   - Badge component ✅
   - Button component ✅
   - Input component ✅
   - Textarea component ✅
   - Card component ✅
   - Dropdown Menu components ✅
   - Error Message component ✅

4. Update existing components ✅
   - Convert DB calls to API calls ✅
   - Add loading states ✅
   - Add error handling ✅
   - Integrate validation schemas ✅
   - Update UI components with new design system ✅
   - Connect delete functionality ✅
   - Connect update functionality ✅

5. Add authentication UI ✅
   - Login form ✅
   - Registration form ✅
   - Password reset flow ⌛
   - Profile management ✅
   - Protected routes ✅
   - Role-based access control ✅

## Phase 7: Future Enhancements
Status: 🚧 In Progress

### Development
1. Configure nodemon ✅
2. Set up concurrent frontend/backend development ✅
3. Configure debugging ✅
4. Set up API documentation generation 🚧
5. Set up request validation ✅
6. Configure production logging 🚧

### Features
1. Password reset functionality ⌛
2. Email verification ⌛
3. Sorting/Filtering for API endpoints ✅
4. API versioning ✅
5. Offline support ⌛
6. Error boundary handling ✅
7. Request retry logic ✅

### Database
1. Add audit fields (created_by, updated_by) ✅
2. Database backup strategy 🚧

### Error Monitoring System
1. Implement secure error logging system for production
   - Capture frontend console errors and logs
   - Secure API endpoint for error reporting
   - Authentication and rate limiting for error submissions
   - Database storage for error logs
   - AI-powered error analysis and auto-fixing capabilities
   - Security considerations:
     - Prevent unauthorized access to error logs
     - Sanitize error data to prevent XSS
     - Rate limiting to prevent abuse
     - Secure storage of sensitive information

### Security Enhancements
Status: 🔜 Do This Next
1. Account Security
   - Implement account lockout after multiple failed attempts ⌛
   - Configure lockout duration and attempt threshold ⌛
   - Add user notification for account lockouts ⌛
   - Add admin interface for managing locked accounts ⌛
2. Password Security
   - Implement password complexity requirements ⌛
   - Add password expiration policy ⌛
   - Prevent password reuse ⌛
3. Session Security
   - Implement session timeout ✅
   - Add concurrent session handling ⌛
   - Add session activity logging ⌛

### UI/UX Improvements
Status: 🚧 In Progress
1. Learning Progress Interface
   - Remove redundant UI elements ✅
   - Improve card layout and spacing ✅
   - Add progress visualization ✅
2. Navigation
   - Implement breadcrumbs ⌛
   - Add quick navigation shortcuts ⌛
3. Accessibility
   - Add ARIA labels ⌛
   - Implement keyboard navigation ⌛
   - Add high contrast mode ⌛

## Phase 8: Database Schema Overhaul
Status: ✅ Done

### Database Schema Details

1. Core Content Tables
   - `topic_lessons` ✅
     ```sql
     CREATE TABLE topic_lessons (
       lesson_id INTEGER PRIMARY KEY,
       topic_id INTEGER NOT NULL,
       title TEXT NOT NULL,
       content TEXT NOT NULL,
       order_index INTEGER NOT NULL,
       parent_lesson_id INTEGER,
       created_at INTEGER NOT NULL,
       updated_at INTEGER NOT NULL,
       FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE,
       FOREIGN KEY (parent_lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE SET NULL
     );
     CREATE INDEX idx_topic_lessons_topic ON topic_lessons(topic_id);
     CREATE INDEX idx_topic_lessons_parent ON topic_lessons(parent_lesson_id);
     ```

2. User Learning Data Tables
   - `user_lesson_progress` ✅
     ```sql
     CREATE TABLE user_lesson_progress (
       progress_id INTEGER PRIMARY KEY,
       user_id INTEGER NOT NULL,
       lesson_id INTEGER NOT NULL,
       status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
       last_interaction_at INTEGER NOT NULL,
       completion_date INTEGER,
       FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
       FOREIGN KEY (lesson_id) REFERENCES topic_lessons(lesson_id) ON DELETE CASCADE
     );
     CREATE INDEX idx_lesson_progress_user ON user_lesson_progress(user_id);
     CREATE INDEX idx_lesson_progress_lesson ON user_lesson_progress(lesson_id);
     ```

### Component Updates

1. Existing Component Updates

   a. LearningTree Component ✅
   ```typescript
   interface LearningTreeProps {
     topic: Topic;
     lessons: TopicLesson[];          // Was questions
     userProgress: UserLessonProgress[]; // Was userProgress
   }
   ```
   Changes Needed:
   - Update data fetching to use new lesson endpoints ✅
   - Modify tree rendering to handle parent/child relationships ✅
   - Update progress indicators to use new status enum ✅
   - Keep same UI/UX patterns ✅

   b. TopicLearning Component ✅
   ```typescript
   // Main container component
   // Updates needed:
   - Replace question loading with lesson loading ✅
   - Update progress tracking to use new endpoints ✅
   - Keep same layout structure ✅
   ```

2. New Components

   a. LessonContent Component ✅
   ```typescript
   interface LessonContentProps {
     lesson: TopicLesson;
     progress: UserLessonProgress;
     onProgressUpdate: (status: ProgressStatus) => void;
   }
   ```
   Features:
   - Displays lesson content ✅
   - Shows/manages progress status ✅
   - Handles lesson completion ✅

### Backend Updates

1. Model Updates ✅
   ```typescript
   // models/TopicLesson.ts
   interface TopicLesson {
     lesson_id: number;
     topic_id: number;
     title: string;
     content: string;
     order_index: number;
     parent_lesson_id: number | null;
     created_at: number;
     updated_at: number;
     children?: TopicLesson[];
   }

   // models/UserLessonProgress.ts
   interface UserLessonProgress {
     progress_id: number;
     user_id: number;
     lesson_id: number;
     status: 'not_started' | 'in_progress' | 'completed';
     last_interaction_at: number;
     completion_date: number | null;
   }
   ```

2. API Routes ✅
   ```typescript
   // routes/lessons.ts
   router.get('/api/v1/topics/:topicId/lessons', getLessonsForTopic);
   router.post('/api/v1/topics/:topicId/lessons', createLesson);
   router.put('/api/v1/lessons/:lessonId', updateLesson);
   router.delete('/api/v1/lessons/:lessonId', deleteLesson);
   router.post('/api/v1/topics/:topicId/lessons/reorder', reorderLessons);

   // routes/progress.ts - All require authenticated user
   router.get('/api/v1/users/me/lessons/:lessonId/progress', getUserLessonProgress);
   router.put('/api/v1/users/me/lessons/:lessonId/progress', updateUserLessonProgress);
   router.get('/api/v1/users/me/topics/:topicId/progress', getUserTopicProgress);
   ```

### Implementation Plan

1. Database Setup ✅
   - Create new tables ✅
   - Add indexes and constraints ✅
   - Verify schema integrity ✅

2. Backend Implementation ✅
   - Create new models and types ✅
   - Implement lesson endpoints ✅
   - Add progress tracking endpoints ✅
   - Add validation and error handling ✅
   - Write tests for new functionality ✅

3. Frontend Updates ✅
   - Update types and interfaces ✅
   - Modify LearningTree component ✅
   - Create LessonContent component ✅
   - Update TopicLearning container ✅
   - Update progress tracking ✅
   - Test all interactions ✅

4. Testing Strategy ✅
   - Unit tests for new models ✅
   - API endpoint testing ✅
   - Component integration tests ✅
   - End-to-end user flow testing ✅
   - Performance testing for new queries ✅

## Phase 9: Chat Integration
Status: 🚧 In Progress

### Overview
Implement AI-powered chat functionality for interactive learning experiences. Chat history will be stored in the `user_topic_lessons` table as a JSON blob in the `chat_history` field.

### Implementation Details
1. LLM Integration Strategy:
    *   Choose an LLM service (e.g., OpenAI's GPT-3, a custom model).
    *   Plan how the LLM service will be integrated into the backend (SDK, API calls, etc.).
    *   Define authentication and API request/response handling.
2. Design the Chat Interface:
    *   Plan the UI/UX for the `ChatInterface` component.
    *   Define message display, input handling, and additional features (timestamps, user avatars, loading indicators).
3. Backend Logic:
    *   Implement `getUserLessonChat` API route to fetch chat history from `user_topic_lessons.chat_history`.
    *   Implement `addUserLessonChat` API route to update `user_topic_lessons.chat_history` with new messages.
    *   Integrate with the chosen LLM service to send user messages and receive AI responses.
    *   Handle data transformation and formatting between the application and the LLM service.
4. Create Frontend Components:
    *   Develop the `ChatInterface` component based on the design.
    *   Implement `Message display` and `Input handling` sub-components.
5. Integrate Frontend and Backend:
    *   Connect frontend components to API routes for sending and receiving messages.
    *   Implement real-time updates using technologies like WebSockets.

### Components to Add
   - ChatInterface component
   - Message display
   - Input handling
   - Integration with LLM service (details TBD)

### API Routes
   ```typescript
   router.get('/api/v1/users/me/lessons/:lessonId/chat', getUserLessonChat);
   router.post('/api/v1/users/me/lessons/:lessonId/chat', addUserLessonChat);
   ```

Details of LLM integration and specific chat features will be defined when we reach this phase.

## Testing Strategy
Status: ✅ Done
1. Unit tests for validation schemas ✅
   - Auth validation ✅
   - Topics validation ✅
   - Questions validation ✅
   - Progress validation ✅
2. Unit tests for API client ✅
   - Base client tests ✅
   - Auth service tests ✅
   - Topics service tests ✅
   - Questions service tests ✅
   - Progress service tests ✅
3. Unit tests for API endpoints ✅
   - Auth endpoints ✅
     - User registration (success/failure) ✅
     - User login (success/failure) ✅
     - Session management ✅
     - /me endpoint ✅
   - Topics endpoints ✅
     - List topics (user/admin) ✅
     - Create topic (permissions) ✅
     - Update/delete (ownership) ✅
   - Questions endpoints ✅
     - Get questions for topic ✅
       - Test user ownership check ✅
       - Test admin access ✅
       - Test invalid topic ID ✅
       - Test empty topic ✅
     - Create question ✅
       - Test admin-only access ✅
       - Test option validation ✅
       - Test correct answer validation ✅
       - Test invalid topic ID ✅
     - Update question ✅
       - Test admin-only access ✅
       - Test option validation ✅
       - Test invalid question ID ✅
   - Progress endpoints ✅
     - Get topic progress ✅
       - Test user ownership check ✅
       - Test admin access ✅
       - Test invalid topic ID ✅
       - Test progress calculation ✅
     - Record progress ✅
       - Test user ownership check ✅
       - Test invalid topic ID ✅
       - Test invalid question ID ✅
       - Test question-topic mismatch ✅
4. Integration tests for database operations ✅
   - Auth operations ✅
   - Topic operations ✅
   - Question operations ✅
     - Test cascade deletes ✅
     - Test JSON option storage ✅
     - Test ordering by created_at ✅
   - Progress operations ✅
     - Test progress recording ✅
     - Test progress aggregation ✅
     - Test cascade deletes ✅
5. Authentication flow testing ✅
   - Registration flow ✅
   - Login flow ✅
   - Session validation ✅
6. Frontend integration testing ✅

## Deployment Considerations
Status: 🚧 In Progress
1. Update build scripts ✅
2. Environment variable management ✅
3. Database migration process ✅
4. API documentation deployment 🚧

## Testing & Deployment
Status: 🚧 In Progress
1. End-to-end testing 🚧
   - Auth flow tests ✅
   - Session cleanup ✅
2. Cross-browser testing ⌛
3. Load testing ⌛
4. Zero-downtime deployment ⌛
5. Monitoring setup ⌛
6. Error tracking setup ⌛
7. Backup strategy ⌛
8. Rollback procedures ⌛
