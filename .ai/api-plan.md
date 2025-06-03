# REST API Plan - 10xDevFiszki

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| **Users** | `auth.users` | User accounts managed by Supabase Auth with authentication and profile data |
| **Collections** | `collections` | User-created collections to organize flashcards by topic or subject |
| **Categories** | `categories` | User-defined categories for tagging and filtering flashcards |
| **Flashcards** | `flashcards` | Individual flashcards with SM-2 parameters |
| **AI Generation** | `-` | AI flashcard generation service |
| **Study Sessions** | `study_sessions` | Learning session tracking with progress and completion metrics |
| **Generation Stats** | `flashcard_generation_stats` | AI generation metrics and acceptance rate statistics |

## 2. Endpoints

### 2.1 Authentication & User Management

#### Delete User Account
- **Method**: DELETE
- **Path**: `/api/users/me`
- **Description**: Delete user account with all associated data (GDPR compliance)
- **Authentication**: Required (Bearer token)
- **Request Body**: 
```json
{
  "confirmation": "DELETE_MY_ACCOUNT"
}
```
- **Response**: 204 No Content
- **Error Codes**: 
  - 401 Unauthorized - Invalid or missing token
  - 400 Bad Request - Missing or invalid confirmation

#### Get User Statistics
- **Method**: GET
- **Path**: `/api/users/me/stats`
- **Description**: Get comprehensive user statistics and metrics
- **Authentication**: Required
- **Response**: 200 OK
```json
{
  "totalFlashcards": 145,
  "totalCollections": 8,
  "totalCategories": 12,
  "studySessionsCompleted": 23,
  "averageSessionDuration": 118,
  "generationStats": {
    "totalGenerated": 89,
    "totalAcceptedDirect": 67,
    "totalAcceptedEdited": 12,
    "acceptanceRate": 88.8,
    "lastGenerationAt": "2025-01-15T10:30:00Z"
  },
  "studyMetrics": {
    "flashcardsReviewedToday": 15,
    "flashcardsDueForReview": 23,
    "averageEasinessFactor": 2.3
  }
}
```

### 2.2 Collections

#### List Collections
- **Method**: GET
- **Path**: `/api/collections`
- **Description**: Get user's flashcard collections
- **Query Parameters**:
  - `page` (optional, default=1) - Page number
  - `limit` (optional, default=20, max=100) - Items per page
  - `sort` (optional, default=created_at) - Sort field (name, created_at)
  - `order` (optional, default=desc) - Sort order (asc, desc)
- **Response**: 200 OK
```json
{
  "collections": [
    {
      "id": "uuid",
      "name": "JavaScript Fundamentals",
      "description": "Core JS concepts and syntax",
      "flashcardCount": 25,
      "createdAt": "2025-01-10T12:00:00Z",
      "updatedAt": "2025-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Create Collection
- **Method**: POST
- **Path**: `/api/collections`
- **Request Body**:
```json
{
  "name": "React Hooks",
  "description": "useState, useEffect, custom hooks"
}
```
- **Response**: 201 Created
```json
{
  "id": "uuid",
  "name": "React Hooks", 
  "description": "useState, useEffect, custom hooks",
  "flashcardCount": 0,
  "createdAt": "2025-01-15T16:45:00Z",
  "updatedAt": "2025-01-15T16:45:00Z"
}
```
- **Error Codes**:
  - 400 Bad Request - Name too long (>250 chars) or duplicate name
  - 422 Unprocessable Entity - Validation errors

#### Update Collection
- **Method**: PUT
- **Path**: `/api/collections/{id}`
- **Request Body**:
```json
{
  "name": "React Hooks Advanced",
  "description": "Advanced patterns with hooks"
}
```
- **Response**: 200 OK (same structure as create)
- **Error Codes**: 
  - 404 Not Found - Collection doesn't exist or not owned by user
  - 400 Bad Request - Validation errors

#### Delete Collection
- **Method**: DELETE
- **Path**: `/api/collections/{id}`
- **Response**: 204 No Content
- **Error Codes**: 404 Not Found

### 2.3 Categories

#### List Categories
- **Method**: GET
- **Path**: `/api/categories`
- **Query Parameters**: Same pagination as collections
- **Response**: 200 OK
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Programming",
      "flashcardCount": 67,
      "createdAt": "2025-01-05T09:00:00Z",
      "updatedAt": "2025-01-15T11:22:00Z"
    }
  ],
  "pagination": { /* same as collections */ }
}
```

#### Create Category
- **Method**: POST
- **Path**: `/api/categories`
- **Request Body**:
```json
{
  "name": "Data Structures"
}
```
- **Response**: 201 Created
```json
{
  "id": "uuid",
  "name": "Data Structures",
  "flashcardCount": 0,
  "createdAt": "2025-01-15T16:50:00Z",
  "updatedAt": "2025-01-15T16:50:00Z"
}
```

#### Update Category
- **Method**: PUT
- **Path**: `/api/categories/{id}`
- **Request/Response**: Same structure as create

#### Delete Category
- **Method**: DELETE
- **Path**: `/api/categories/{id}`
- **Response**: 204 No Content

### 2.4 Flashcards

#### List Flashcards
- **Method**: GET
- **Path**: `/api/flashcards`
- **Query Parameters**:
  - `collectionId` (optional) - Filter by collection
  - `categoryId` (optional) - Filter by category  
  - `dueForReview` (optional, boolean) - Only cards due for review
  - `createdBy` (optional) - Filter by creation method (manual, ai_generated)
  - Standard pagination parameters
- **Response**: 200 OK
```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front": "What is closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer scope even after the outer function returns",
      "collectionId": "uuid",
      "categoryId": "uuid", 
      "easinessFactor": 2.5,
      "interval": 1,
      "repetitions": 0,
      "nextReviewDate": "2025-01-16T00:00:00Z",
      "createdBy": "ai_generated",
      "createdAt": "2025-01-15T12:00:00Z",
      "updatedAt": "2025-01-15T12:00:00Z"
    }
  ],
  "pagination": { /* standard pagination */ }
}
```

#### Create Flashcard
- **Method**: POST
- **Path**: `/api/flashcards`
- **Request Body**:
```json
{
  "front": "What is React useState?",
  "back": "A Hook that lets you add state to functional components",
  "collectionId": "uuid",
  "categoryId": "uuid"
}
```
- **Response**: 201 Created (same structure as list item)
- **Error Codes**:
  - 400 Bad Request - Front >200 chars, back >500 chars, invalid references
  - 422 Unprocessable Entity - Validation errors

#### Generate Flashcards with AI
- **Method**: POST
- **Path**: `/api/flashcards/generate`
- **Request Body**:
```json
{
  "text": "JavaScript closures are a fundamental concept...", 
  "targetCount": 10
}
```
- **Response**: 200 OK
```json
{
  "candidates": [
    {
      "front": "What is a closure?",
      "back": "A function that retains access to its outer scope variables",
      "confidence": 0.92
    }
  ],
  "generationId": "uuid",
  "totalGenerated": 8
}
```
- **Error Codes**:
  - 400 Bad Request - Text length not in 1000-10000 range
  - 429 Too Many Requests - Rate limiting
  - 503 Service Unavailable - AI service error

#### Review Generated Flashcards
- **Method**: POST
- **Path**: `/api/flashcards/review`
- **Request Body**:
```json
{
  "generationId": "uuid",
  "collectionId": "uuid",
  "categoryId": "uuid",
  "decisions": [
    {
      "candidateIndex": 0,
      "action": "accept",
      "front": "What is a closure?",
      "back": "A function that retains access to its outer scope variables"
    },
    {
      "candidateIndex": 1, 
      "action": "accept_edited",
      "front": "Edited question about scope",
      "back": "Edited answer about scope"
    },
    {
      "candidateIndex": 2,
      "action": "reject"
    }
  ]
}
```
- **Response**: 201 Created
```json
{
  "acceptedFlashcards": [
    {
      "id": "uuid",
      "front": "What is a closure?",
      "back": "A function that retains access to its outer scope variables",
      "collectionId": "uuid",
      "categoryId": "uuid",
      "createdBy": "ai_generated"
    }
  ],
  "stats": {
    "totalCandidates": 8,
    "acceptedDirect": 5,
    "acceptedEdited": 2,
    "rejected": 1
  }
}
```

#### Update Flashcard
- **Method**: PUT
- **Path**: `/api/flashcards/{id}`
- **Request Body**:
```json
{
  "front": "Updated question",
  "back": "Updated answer",
  "categoryId": "uuid"
}
```
- **Response**: 200 OK

#### Delete Flashcard
- **Method**: DELETE
- **Path**: `/api/flashcards/{id}`
- **Response**: 204 No Content

### 2.5 Study Sessions

#### Start Study Session
- **Method**: POST
- **Path**: `/api/study-sessions`
- **Request Body**:
```json
{
  "collectionId": "uuid",
  "studyType": "review" // or "new"
}
```
- **Response**: 201 Created
```json
{
  "sessionId": "uuid",
  "collectionId": "uuid", 
  "flashcardsToReview": [
    {
      "id": "uuid",
      "front": "What is closure?",
      "back": "A function with access to outer scope"
    }
  ],
  "totalFlashcards": 15,
  "startedAt": "2025-01-15T17:00:00Z"
}
```

#### Submit Study Response
- **Method**: PUT
- **Path**: `/api/study-sessions/{sessionId}/response`
- **Request Body**:
```json
{
  "flashcardId": "uuid",
  "quality": 4, // SM-2 quality rating 0-5
  "responseTime": 8500 // milliseconds
}
```
- **Response**: 200 OK
```json
{
  "nextFlashcard": {
    "id": "uuid",
    "front": "Next question",
    "back": "Next answer"
  },
  "updatedParameters": {
    "easinessFactor": 2.6,
    "interval": 6, 
    "repetitions": 2,
    "nextReviewDate": "2025-01-21T00:00:00Z"
  },
  "sessionProgress": {
    "completed": 8,
    "remaining": 7
  }
}
```

#### Complete Study Session
- **Method**: PUT
- **Path**: `/api/study-sessions/{sessionId}/complete`
- **Response**: 200 OK
```json
{
  "sessionId": "uuid",
  "duration": 127, // seconds
  "flashcardsReviewed": 15,
  "averageResponseTime": 6800,
  "completedAt": "2025-01-15T17:15:23Z"
}
```

#### Get Active Study Session
- **Method**: GET
- **Path**: `/api/study-sessions/active`
- **Response**: 200 OK or 404 if no active session

### 2.6 Statistics & Analytics

#### Get Generation Statistics
- **Method**: GET
- **Path**: `/api/stats/generation`
- **Response**: 200 OK
```json
{
  "totalGenerated": 234,
  "totalAcceptedDirect": 178,
  "totalAcceptedEdited": 31,
  "totalRejected": 25,
  "acceptanceRate": 89.3,
  "editRate": 13.2,
  "lastGenerationAt": "2025-01-15T14:22:00Z",
  "monthlyTrend": [
    {
      "month": "2025-01",
      "generated": 89,
      "accepted": 79
    }
  ]
}
```

## 3. Authentication & Authorization

### Authentication Method
- **Primary**: Supabase Auth with JWT tokens
- **Token Type**: Bearer tokens in Authorization header
- **Session Management**: Handled by Supabase client-side SDK
- **Refresh**: Automatic token refresh via Supabase

### Authorization Rules
- **Row Level Security (RLS)**: All database tables have RLS policies
- **User Isolation**: Users can only access their own data
- **Resource Ownership**: All operations validated against `auth.uid()`
- **API Key**: Rate limiting and service protection via API keys

### Security Headers
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
X-Client-Version: 1.0.0
```

## 4. Validation & Business Logic

### Input Validation Rules

#### Collections
- **name**: Required, 1-250 characters, unique per user
- **description**: Optional, max 1000 characters

#### Categories  
- **name**: Required, 1-250 characters, unique per user

#### Flashcards
- **front**: Required, 1-200 characters
- **back**: Required, 1-500 characters  
- **easinessFactor**: 1.3-2.5 (automatic via SM-2)
- **interval**: Positive integer (automatic via SM-2)
- **repetitions**: Non-negative integer (automatic via SM-2)

#### AI Generation
- **text**: Required, 1000-10000 characters
- **targetCount**: Optional, 5-15 (default: 10)

#### Study Sessions
- **quality**: Required, 0-5 integer for SM-2 algorithm
- **responseTime**: Required, positive integer (milliseconds)

### Business Logic Implementation

#### SM-2 Spaced Repetition Algorithm
- **Automatic Updates**: SM-2 parameters updated after each study response
- **Quality Mapping**: User feedback (Easy/Hard/Good) mapped to 0-5 scale
- **Next Review Calculation**: Based on easiness factor and interval
- **Implementation**: Server-side calculation to prevent manipulation

#### AI Generation Workflow
1. **Input Validation**: Text length and content filtering
2. **AI Processing**: Call to OPENROUTER.ai with retry logic
3. **Response Filtering**: Quality scoring and duplicate removal
4. **Candidate Generation**: 5-15 flashcard candidates returned
5. **Statistics Tracking**: Generation attempts and success rates

#### Session Management
- **Automatic Timeout**: Sessions auto-expire after 30 minutes of inactivity
- **Progress Persistence**: Partial progress saved for session continuation
- **Completion Tracking**: Detailed metrics for study effectiveness

#### Data Privacy (GDPR Compliance)
- **Hard Delete**: Complete data removal on account deletion
- **Data Export**: User statistics and flashcard export capability
- **Consent Tracking**: User consent for AI processing logged
- **Retention Policy**: Automatic cleanup of expired sessions

### Error Handling Standards

#### HTTP Status Codes
- **200 OK**: Successful retrieval/update
- **201 Created**: Successful creation
- **204 No Content**: Successful deletion
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required/invalid
- **403 Forbidden**: Access denied to resource
- **404 Not Found**: Resource doesn't exist
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **503 Service Unavailable**: External service (AI) failure

#### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text exceeds 200 character limit",
    "details": {
      "field": "front",
      "maxLength": 200,
      "actualLength": 245
    },
    "timestamp": "2025-01-15T17:30:00Z"
  }
}
```

### Rate Limiting
- **AI Generation**: 10 requests per hour per user
- **Standard Operations**: 1000 requests per hour per user
- **Bulk Operations**: 50 requests per hour per user
- **Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Performance Considerations
- **Database Indexes**: Optimized for common query patterns
- **Pagination**: Default 20 items, max 100 per request
- **Caching**: Response caching for statistics and user data
- **Async Processing**: AI generation processed asynchronously
- **Connection Pooling**: Supabase connection optimization 