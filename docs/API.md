# 10xDevFiszki API Documentation

## Overview

10xDevFiszki REST API provides endpoints for AI-powered flashcard generation, user authentication, and statistics tracking. The API is built with Astro 5 and TypeScript, using Supabase for backend services.

**Base URL**: `http://localhost:3001/api`
**Content-Type**: `application/json`

## Authentication

All endpoints except `/auth/login` require user authentication via Supabase session cookies.

### POST /auth/login

Authenticate user and establish session.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "aud": "authenticated",
    "role": "authenticated",
    "email_confirmed_at": "timestamp",
    "confirmed_at": "timestamp",
    "last_sign_in_at": "timestamp",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "email_verified": true
    },
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "is_anonymous": false
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid credentials or request body"
}
```

---

## AI Flashcard Generation

### POST /generate-flashcards

Generate flashcards from text using AI (Mistral 7B Instruct model via OpenRouter).

**Authentication**: Required
**Rate Limit**: 10 requests per minute per user

**Request Body:**
```json
{
  "text": "string",           // Required: 1000-10000 characters
  "collection_id": "uuid",   // Optional: UUID for context
  "max_cards": 10           // Optional: 1-15, default: 10
}
```

**Success Response (200):**
```json
{
  "data": {
    "candidates": [
      {
        "front": "What is JavaScript?",
        "back": "Programming language for web development",
        "confidence": 0.9
      }
    ],
    "generated_count": 1,
    "processing_time_ms": 1250
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "User must be authenticated to access this resource"
  }
}
```

**422 Validation Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR", 
    "message": "Input validation failed",
    "details": {
      "text": "Text must be between 1000 and 10000 characters"
    }
  }
}
```

**429 Rate Limit:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many generation requests. Please wait before trying again.",
    "details": {
      "limit": 10,
      "window": "1 minute",
      "retry_after": 45
    }
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": {
    "code": "AI_GENERATION_FAILED",
    "message": "Failed to generate flashcards with AI"
  }
}
```

---

## Statistics

### GET /stats/generation

Get AI generation statistics for the current user.

**Authentication**: Required

**Success Response (200):**
```json
{
  "data": {
    "total_generations": 15,
    "total_cards_generated": 142,
    "average_cards_per_generation": 9.47,
    "last_generation_at": "2025-05-31T20:15:30Z",
    "this_month": {
      "generations": 8,
      "cards_generated": 76
    },
    "today": {
      "generations": 2,
      "cards_generated": 18
    }
  }
}
```

---

## Data Types

### FlashcardCandidate
```typescript
interface FlashcardCandidate {
  front: string;        // Question/prompt (max 200 chars)
  back: string;         // Answer/explanation (max 500 chars) 
  confidence: number;   // AI confidence score (0.0-1.0)
}
```

### AIGenerationRequest
```typescript
interface AIGenerationRequest {
  text: string;           // 1000-10000 characters
  collection_id?: string; // Optional UUID
  max_cards?: number;     // 1-15, default: 10
}
```

### ErrorResponse
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## Rate Limiting

The API implements sliding window rate limiting:

- **Generation endpoints**: 10 requests per minute per user
- **Rate limit headers** (when applicable):
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | User session required |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AI_GENERATION_FAILED` | AI service error |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## Examples

### Generate flashcards from JavaScript text:

```bash
curl -X POST http://localhost:3001/api/generate-flashcards \
  -H "Content-Type: application/json" \
  -d '{
    "text": "JavaScript is a programming language primarily used for creating interactive websites. It is an interpreted language, meaning code is executed directly by the web browser without prior compilation. JavaScript enables DOM manipulation, user event handling, and server communication via AJAX. The language supports both object-oriented and functional programming paradigms...",
    "max_cards": 3
  }'
```

### Login user:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## Technology Stack

- **Framework**: Astro 5 with Node.js adapter
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **AI Provider**: OpenRouter (Mistral 7B Instruct)
- **Validation**: Zod schemas
- **Authentication**: Supabase Auth with session cookies

---

## Development Notes

- All endpoints use JSON for request/response bodies
- Session-based authentication via HTTP cookies
- Input validation with detailed error messages
- Comprehensive error handling and logging
- Rate limiting with cleanup mechanisms
- AI response parsing and validation
- Database transaction safety for statistics 

## AI Generation API

### POST /api/generate-flashcards

Generates flashcards from text input using AI (Mistral 7B Instruct model).

**Requirements:**
- Authentication required
- Rate limiting: 10 requests/minute per user
- Text length: 1000-10000 characters
- Maximum cards per request: 15

**Request Headers:**
```
Content-Type: application/json
Cookie: session-cookie (from login)
```

**Request Body:**
```json
{
  "text": "Your learning content here (1000-10000 chars)",
  "collection_id": "optional-uuid-for-context",
  "max_cards": 10
}
```

**Response (200 OK):**
```json
{
  "data": {
    "candidates": [
      {
        "front": "Question text",
        "back": "Answer text", 
        "confidence": 0.85
      }
    ],
    "generated_count": 2,
    "processing_time_ms": 10483
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `422` - Validation error (text too short/long, invalid max_cards)
- `429` - Rate limit exceeded (10 requests/minute)
- `500` - AI generation failed

---

## AI Review API

### POST /api/flashcards/review

Batch processing and approval of AI-generated flashcard candidates.

**Requirements:**
- Authentication required
- Rate limiting: 10 requests/minute per user
- Maximum 15 flashcards per batch
- Actions: accept_direct, accept_edited, reject

**Request Headers:**
```
Content-Type: application/json
Cookie: session-cookie (from login)
```

**Request Body:**
```json
{
  "collection_id": "uuid-string",
  "category_id": "uuid-string",
  "flashcards": [
    {
      "front": "Question text (max 200 chars)",
      "back": "Answer text (max 500 chars)", 
      "action": "accept_direct|accept_edited|reject"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "data": {
    "created_count": 2,
    "accepted_direct": 1,
    "accepted_edited": 1,
    "rejected": 0,
    "flashcards": [
      {
        "id": "uuid",
        "front": "Question",
        "back": "Answer",
        "collection_id": "uuid",
        "category_id": "uuid",
        "created_by": "ai_generated",
        "easiness_factor": 2.5,
        "interval_days": 1,
        "reviews_count": 0,
        "next_review_at": "2025-06-01T10:00:00Z"
      }
    ]
  }
}
```

## Categories API

### GET /api/categories

Returns a paginated list of user's categories with flashcard counts.

**Requirements:**
- Authentication required
- Supports pagination, sorting, and filtering

**Request Headers:**
```
Cookie: session-cookie (from login)
```

**Query Parameters:**
```
limit (optional): Number of categories per page (1-100, default: 20)
offset (optional): Number of categories to skip (default: 0)
sort (optional): Sort field - created_at|updated_at|name (default: created_at)
order (optional): Sort order - asc|desc (default: desc)
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "da640844-3465-4941-a6c9-f6acca3e7857",
      "name": "JavaScript",
      "flashcard_count": 25,
      "created_at": "2025-05-31T21:19:40.744339+00:00",
      "updated_at": "2025-05-31T21:20:30.123456+00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### POST /api/categories

Creates a new category for the authenticated user.

**Requirements:**
- Authentication required
- Category name must be unique per user
- Name length: 1-250 characters

**Request Headers:**
```
Content-Type: application/json
Cookie: session-cookie (from login)
```

**Request Body:**
```json
{
  "name": "JavaScript"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "da640844-3465-4941-a6c9-f6acca3e7857",
    "name": "JavaScript",
    "flashcard_count": 0,
    "created_at": "2025-05-31T21:19:40.744339+00:00",
    "updated_at": "2025-05-31T21:19:40.744339+00:00"
  }
}
```

### GET /api/categories/{id}

Returns details of a specific category.

**Requirements:**
- Authentication required
- Category must belong to authenticated user

**Request Headers:**
```
Cookie: session-cookie (from login)
```

**Path Parameters:**
```
id: UUID of the category
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "da640844-3465-4941-a6c9-f6acca3e7857",
    "name": "JavaScript",
    "flashcard_count": 25,
    "created_at": "2025-05-31T21:19:40.744339+00:00",
    "updated_at": "2025-05-31T21:20:30.123456+00:00"
  }
}
```

### PUT /api/categories/{id}

Updates a category's name with uniqueness validation.

**Requirements:**
- Authentication required
- Category must belong to authenticated user
- New name must be unique per user
- Name length: 1-250 characters

**Request Headers:**
```
Content-Type: application/json
Cookie: session-cookie (from login)
```

**Path Parameters:**
```
id: UUID of the category
```

**Request Body:**
```json
{
  "name": "JavaScript & TypeScript"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "da640844-3465-4941-a6c9-f6acca3e7857",
    "name": "JavaScript & TypeScript",
    "flashcard_count": 25,
    "created_at": "2025-05-31T21:19:40.744339+00:00",
    "updated_at": "2025-05-31T21:20:30.123456+00:00"
  }
}
```

### DELETE /api/categories/{id}

Deletes a category and handles associated flashcards.

**Requirements:**
- Authentication required
- Category must belong to authenticated user
- Associated flashcards will be handled according to database constraints

**Request Headers:**
```
Cookie: session-cookie (from login)
```

**Path Parameters:**
```
id: UUID of the category
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Category deleted successfully",
    "deleted_id": "da640844-3465-4941-a6c9-f6acca3e7857"
  }
}
```

## Common Error Responses

### Categories API Errors

**409 Conflict - Category Name Exists:**
```json
{
  "error": {
    "code": "CATEGORY_NAME_EXISTS",
    "message": "A category with this name already exists",
    "details": {
      "field": "name"
    }
  }
}
```

**404 Not Found - Category Not Found:**
```json
{
  "error": {
    "code": "CATEGORY_NOT_FOUND", 
    "message": "Category not found or access denied"
  }
}
```

**422 Validation Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "name": "Category name is required"
    }
  }
}
```