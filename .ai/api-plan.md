# REST API Plan - 10xDevFiszki

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Collections | collections | User flashcard collections |
| Categories | categories | Flashcard categories for organization |
| Flashcards | flashcards | Individual flashcards with SM-2 parameters |
| Study Sessions | study_sessions | Learning session tracking |
| Generation Stats | flashcard_generation_stats | AI generation statistics |
| AI Generation | - | AI flashcard generation service |

## 2. Endpoints

### 2.1 Collections

#### GET /api/collections
- **Description**: Retrieve user's collections
- **Query Parameters**: 
  - `limit` (integer, default: 20, max: 100)
  - `offset` (integer, default: 0)
  - `sort` (string: 'created_at', 'updated_at', 'name', default: 'created_at')
  - `order` (string: 'asc', 'desc', default: 'desc')
- **Response**: 200 OK
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "flashcard_count": 0,
      "created_at": "2025-05-31T14:00:00Z",
      "updated_at": "2025-05-31T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```
- **Error Codes**: 401 Unauthorized, 500 Internal Server Error

#### POST /api/collections
- **Description**: Create new collection
- **Request Body**:
```json
{
  "name": "string", // required, max 250 chars
  "description": "string" // optional
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "flashcard_count": 0,
    "created_at": "2025-05-31T14:00:00Z",
    "updated_at": "2025-05-31T14:00:00Z"
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 409 Conflict (name exists), 422 Unprocessable Entity

#### GET /api/collections/{id}
- **Description**: Retrieve specific collection
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### PATCH /api/collections/{id}
- **Description**: Update collection
- **Request Body**:
```json
{
  "name": "string", // optional, max 250 chars
  "description": "string" // optional
}
```
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict

#### DELETE /api/collections/{id}
- **Description**: Delete collection and all flashcards
- **Response**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### 2.2 Categories

#### GET /api/categories
- **Description**: Retrieve user's categories
- **Query Parameters**: Same pagination as collections
- **Response**: 200 OK
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "flashcard_count": 0,
      "created_at": "2025-05-31T14:00:00Z",
      "updated_at": "2025-05-31T14:00:00Z"
    }
  ],
  "pagination": { "..." }
}
```

#### POST /api/categories
- **Description**: Create new category
- **Request Body**:
```json
{
  "name": "string" // required, max 250 chars
}
```
- **Response**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 409 Conflict

#### PATCH /api/categories/{id}
- **Description**: Update category
- **Request Body**: Same as POST
- **Response**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict

#### DELETE /api/categories/{id}
- **Description**: Delete category (sets flashcards category_id to null)
- **Response**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### 2.3 Flashcards

#### GET /api/flashcards
- **Description**: Retrieve user's flashcards
- **Query Parameters**:
  - Standard pagination parameters
  - `collection_id` (uuid, optional)
  - `category_id` (uuid, optional)
  - `created_by` (string: 'manual', 'ai_generated', optional)
  - `due` (boolean, optional) - only flashcards due for review
- **Response**: 200 OK
```json
{
  "data": [
    {
      "id": "uuid",
      "collection_id": "uuid",
      "category_id": "uuid",
      "front": "string",
      "back": "string",
      "easiness_factor": 2.5,
      "interval": 1,
      "repetitions": 0,
      "next_review_date": "2025-06-01T14:00:00Z",
      "created_by": "manual",
      "created_at": "2025-05-31T14:00:00Z",
      "updated_at": "2025-05-31T14:00:00Z"
    }
  ],
  "pagination": { "..." }
}
```

#### POST /api/flashcards
- **Description**: Create new flashcard manually
- **Request Body**:
```json
{
  "collection_id": "uuid", // required
  "category_id": "uuid", // optional
  "front": "string", // required, max 200 chars
  "back": "string" // required, max 500 chars
}
```
- **Response**: 201 Created
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found (collection/category), 422 Unprocessable Entity

#### PATCH /api/flashcards/{id}
- **Description**: Update flashcard
- **Request Body**: Same as POST (all fields optional)
- **Response**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity

#### DELETE /api/flashcards/{id}
- **Description**: Delete flashcard
- **Response**: 204 No Content
- **Error Codes**: 401 Unauthorized, 404 Not Found

### 2.4 AI Generation

#### POST /api/generate-flashcards
- **Description**: Generate flashcards using AI
- **Request Body**:
```json
{
  "text": "string", // required, 1000-10000 chars
  "collection_id": "uuid", // optional, for context
  "max_cards": 15 // optional, default: 10, max: 15
}
```
- **Response**: 200 OK
```json
{
  "data": {
    "candidates": [
      {
        "front": "string",
        "back": "string",
        "confidence": 0.95
      }
    ],
    "generated_count": 8,
    "processing_time_ms": 1500
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 422 Unprocessable Entity, 429 Too Many Requests

#### POST /api/flashcards/review
- **Description**: Review and approve AI-generated flashcards
- **Request Body**:
```json
{
  "collection_id": "uuid", // required
  "category_id": "uuid", // optional
  "flashcards": [
    {
      "front": "string", // required, max 200 chars
      "back": "string", // required, max 500 chars
      "action": "accept_direct" // 'accept_direct', 'accept_edited', 'reject'
    }
  ]
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "created_count": 5,
    "accepted_direct": 3,
    "accepted_edited": 2,
    "rejected": 1,
    "flashcards": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "created_by": "ai_generated"
      }
    ]
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity

### 2.5 Study Sessions

#### POST /api/study-sessions
- **Description**: Start new study session
- **Request Body**:
```json
{
  "collection_id": "uuid", // required
  "max_cards": 20 // optional, default: 10
}
```
- **Response**: 201 Created
```json
{
  "data": {
    "id": "uuid",
    "collection_id": "uuid",
    "status": "active",
    "cards_to_review": 5,
    "current_card": {
      "id": "uuid",
      "front": "string",
      "back": "string"
    },
    "progress": {
      "reviewed": 0,
      "remaining": 5
    },
    "started_at": "2025-05-31T14:00:00Z"
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

#### GET /api/study-sessions/{id}
- **Description**: Get current study session state
- **Response**: 200 OK (same structure as POST response)
- **Error Codes**: 401 Unauthorized, 404 Not Found

#### PATCH /api/study-sessions/{id}/answer
- **Description**: Submit answer for current flashcard
- **Request Body**:
```json
{
  "flashcard_id": "uuid", // required
  "quality": 5, // required, 0-5 (SM-2 quality rating)
  "response_time_ms": 3000 // optional
}
```
- **Response**: 200 OK
```json
{
  "data": {
    "session_id": "uuid",
    "status": "active", // or "completed"
    "next_card": {
      "id": "uuid",
      "front": "string",
      "back": "string"
    },
    "progress": {
      "reviewed": 1,
      "remaining": 4
    },
    "updated_sm2_params": {
      "easiness_factor": 2.36,
      "interval": 2,
      "repetitions": 1,
      "next_review_date": "2025-06-02T14:00:00Z"
    }
  }
}
```
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity

#### PATCH /api/study-sessions/{id}/complete
- **Description**: End study session
- **Response**: 200 OK
```json
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "stats": {
      "flashcards_reviewed": 5,
      "session_duration_ms": 120000,
      "average_response_time_ms": 3000
    },
    "ended_at": "2025-05-31T14:02:00Z"
  }
}
```

### 2.6 User Statistics

#### GET /api/users/stats
- **Description**: Get user statistics and metrics
- **Response**: 200 OK
```json
{
  "data": {
    "generation_stats": {
      "total_generated": 150,
      "total_accepted_direct": 120,
      "total_accepted_edited": 20,
      "acceptance_rate": 93.3,
      "last_generation_at": "2025-05-31T14:00:00Z"
    },
    "learning_stats": {
      "total_flashcards": 200,
      "ai_generated_percentage": 75.0,
      "cards_due_today": 15,
      "average_session_time_ms": 90000,
      "sessions_this_week": 5
    },
    "collection_stats": {
      "total_collections": 8,
      "total_categories": 12
    }
  }
}
```

### 2.7 Account Management

#### DELETE /api/users/account
- **Description**: Delete user account and all associated data (GDPR compliance)
- **Request Body**:
```json
{
  "confirmation": "DELETE_MY_ACCOUNT" // required
}
```
- **Response**: 204 No Content
- **Error Codes**: 400 Bad Request, 401 Unauthorized

## 3. Authentication and Authorization

### Authentication Method
- **Supabase Auth Integration**: All endpoints require valid Supabase JWT token
- **Header Format**: `Authorization: Bearer <jwt_token>`
- **Token Source**: Obtained through Supabase Auth (registration/login)

### Authorization Strategy
- **Row Level Security (RLS)**: Database-level isolation ensures users only access their own data
- **API Level**: Additional validation that user_id from JWT matches resource ownership
- **No Role-Based Access**: All authenticated users have same permissions on their own data

### Rate Limiting
- **AI Generation**: 10 requests per minute per user
- **Standard CRUD**: 100 requests per minute per user
- **Study Sessions**: 5 concurrent active sessions per user

## 4. Validation and Business Logic

### Input Validation Rules

#### Flashcards
- `front`: Required, 1-200 characters, non-empty
- `back`: Required, 1-500 characters, non-empty
- `easiness_factor`: 1.3-2.5 (handled by SM-2 algorithm)
- `interval`: Positive integer (handled by SM-2 algorithm)
- `repetitions`: Non-negative integer (handled by SM-2 algorithm)

#### Collections & Categories
- `name`: Required, 1-250 characters, unique per user
- `description`: Optional, max 2000 characters

#### AI Generation
- `text`: Required, 1000-10000 characters
- `max_cards`: 1-15 cards

#### Study Sessions
- `quality`: Required, 0-5 integer (SM-2 standard)
- `response_time_ms`: Optional, positive integer

### Business Logic Implementation

#### SM-2 Algorithm Integration
- **Automatic Updates**: Flashcard SM-2 parameters updated after each review
- **Next Review Calculation**: Based on quality rating and current parameters
- **Default Values**: New flashcards start with easiness_factor=2.5, interval=1, repetitions=0

#### AI Generation Workflow
1. Validate input text length (1000-10000 chars)
2. Call OpenRouter API for flashcard generation
3. Return candidates without saving to database
4. Update generation stats only after review/approval

#### Statistics Tracking
- **Real-time Updates**: Statistics updated via database triggers
- **Aggregated Data**: No detailed logs, only aggregated counters
- **MVP Metrics**: Track 75% AI acceptance rate and 75% AI-generated flashcards

#### Session Management
- **Continuation Support**: Users can resume interrupted sessions
- **Timeout Handling**: Sessions auto-expire after 30 minutes of inactivity
- **Progress Tracking**: Real-time progress updates during sessions

### Error Handling Standards
- **Consistent Format**: All errors return standardized JSON structure
- **Validation Errors**: Detailed field-level error messages
- **Business Logic Errors**: Clear, user-friendly error descriptions
- **Rate Limiting**: Proper HTTP 429 responses with retry headers 