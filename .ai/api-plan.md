# REST API Plan

## 1. Resources

- **Users**: Authentication managed by Supabase Auth
- **Collections**: User-created collections of flashcards (`collections` table)
- **Categories**: User-defined categories to organize flashcards (`categories` table)
- **Flashcards**: Core resource containing educational content (`flashcards` table)
- **FlashcardGenerationStats**: Statistics about AI-generated flashcards (`flashcard_generation_stats` table)

## 2. Endpoints

### Authentication

Authentication is handled by Supabase Auth. The following endpoints are provided through Supabase's authentication service:

| Method | Path                    | Description                                      |
|--------|-------------------------|--------------------------------------------------|
| POST   | `/auth/signup`          | Register a new user                              |
| POST   | `/auth/signin`          | Sign in a user                                   |
| POST   | `/auth/signout`         | Sign out a user                                  |
| POST   | `/auth/reset-password`  | Request a password reset                         |
| GET    | `/auth/user`            | Get the current authenticated user               |
| DELETE | `/auth/user`            | Delete the user's account                        |

### Collections

#### List Collections

- **Method**: GET
- **Path**: `/api/collections`
- **Description**: Retrieve all collections belonging to the authenticated user
- **Query Parameters**:
  - `limit` (integer, optional): Number of records to return (default: 20)
  - `offset` (integer, optional): Number of records to skip (default: 0)
  - `sort` (string, optional): Field to sort by (default: `created_at`)
  - `order` (string, optional): Sort order, either `asc` or `desc` (default: `desc`)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "meta": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer"
    }
  }
  ```
- **Success Codes**:
  - 200: Collections retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

#### Get Collection

- **Method**: GET
- **Path**: `/api/collections/:id`
- **Description**: Retrieve a specific collection by ID
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 200: Collection retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 404: Collection not found
  - 500: Server error

#### Create Collection

- **Method**: POST
- **Path**: `/api/collections`
- **Description**: Create a new collection
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 201: Collection created successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 500: Server error

#### Update Collection

- **Method**: PUT
- **Path**: `/api/collections/:id`
- **Description**: Update an existing collection
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 200: Collection updated successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 404: Collection not found
  - 500: Server error

#### Delete Collection

- **Method**: DELETE
- **Path**: `/api/collections/:id`
- **Description**: Delete a collection
- **Response**:
  ```json
  {
    "success": true
  }
  ```
- **Success Codes**:
  - 200: Collection deleted successfully
- **Error Codes**:
  - 401: Unauthorized
  - 404: Collection not found
  - 500: Server error

### Categories

#### List Categories

- **Method**: GET
- **Path**: `/api/categories`
- **Description**: Retrieve all categories belonging to the authenticated user
- **Query Parameters**:
  - `limit` (integer, optional): Number of records to return (default: 20)
  - `offset` (integer, optional): Number of records to skip (default: 0)
  - `sort` (string, optional): Field to sort by (default: `created_at`)
  - `order` (string, optional): Sort order, either `asc` or `desc` (default: `desc`)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "meta": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer"
    }
  }
  ```
- **Success Codes**:
  - 200: Categories retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

#### Get Category

- **Method**: GET
- **Path**: `/api/categories/:id`
- **Description**: Retrieve a specific category by ID
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 200: Category retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 404: Category not found
  - 500: Server error

#### Create Category

- **Method**: POST
- **Path**: `/api/categories`
- **Description**: Create a new category
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 201: Category created successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 409: Category with this name already exists
  - 500: Server error

#### Update Category

- **Method**: PUT
- **Path**: `/api/categories/:id`
- **Description**: Update an existing category
- **Request Body**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 200: Category updated successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 404: Category not found
  - 409: Category with this name already exists
  - 500: Server error

#### Delete Category

- **Method**: DELETE
- **Path**: `/api/categories/:id`
- **Description**: Delete a category
- **Response**:
  ```json
  {
    "success": true
  }
  ```
- **Success Codes**:
  - 200: Category deleted successfully
- **Error Codes**:
  - 401: Unauthorized
  - 404: Category not found
  - 500: Server error

### Flashcards

#### List Flashcards

- **Method**: GET
- **Path**: `/api/flashcards`
- **Description**: Retrieve all flashcards belonging to the authenticated user
- **Query Parameters**:
  - `limit` (integer, optional): Number of records to return (default: 20)
  - `offset` (integer, optional): Number of records to skip (default: 0)
  - `sort` (string, optional): Field to sort by (default: `created_at`)
  - `order` (string, optional): Sort order, either `asc` or `desc` (default: `desc`)
  - `collection_id` (uuid, optional): Filter by collection
  - `category_id` (uuid, optional): Filter by category
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "meta": {
      "total": "integer",
      "limit": "integer",
      "offset": "integer"
    }
  }
  ```
- **Success Codes**:
  - 200: Flashcards retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

#### Get Flashcard

- **Method**: GET
- **Path**: `/api/flashcards/:id`
- **Description**: Retrieve a specific flashcard by ID
- **Response**:
  ```json
  {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "collection_id": "uuid | null",
    "category_id": "uuid | null",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 200: Flashcard retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 404: Flashcard not found
  - 500: Server error

#### Create Flashcard

- **Method**: POST
- **Path**: `/api/flashcards`
- **Description**: Create a new flashcard
- **Request Body**:
  ```json
  {
    "front": "string",
    "back": "string",
    "collection_id": "uuid | null",
    "category_id": "uuid | null"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "collection_id": "uuid | null",
    "category_id": "uuid | null",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 201: Flashcard created successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 404: Collection or category not found
  - 500: Server error

#### Bulk Create Flashcards

- **Method**: POST
- **Path**: `/api/flashcards/bulk`
- **Description**: Create multiple flashcards at once
- **Request Body**:
  ```json
  {
    "id": "uuid",
    "flashcards": [
      {
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
  ```
- **Success Codes**:
  - 201: Flashcards created successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 404: Collection or category not found
  - 500: Server error

#### Update Flashcard

- **Method**: PUT
- **Path**: `/api/flashcards/:id`
- **Description**: Update an existing flashcard
- **Request Body**:
  ```json
  {
    "front": "string",
    "back": "string",
    "collection_id": "uuid | null",
    "category_id": "uuid | null"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "front": "string",
    "back": "string",
    "collection_id": "uuid | null",
    "category_id": "uuid | null",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
  ```
- **Success Codes**:
  - 200: Flashcard updated successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 404: Flashcard, collection or category not found
  - 500: Server error

#### Delete Flashcard

- **Method**: DELETE
- **Path**: `/api/flashcards/:id`
- **Description**: Delete a flashcard
- **Response**:
  ```json
  {
    "success": true
  }
  ```
- **Success Codes**:
  - 200: Flashcard deleted successfully
- **Error Codes**:
  - 401: Unauthorized
  - 404: Flashcard not found
  - 500: Server error

### Spaced Repetition

#### Mark Flashcard as Learned or Requiring Review

- **Method**: POST
- **Path**: `/api/flashcards/:id/review`
- **Description**: Mark a flashcard as learned or requiring review
- **Request Body**:
  ```json
  {
    "status": "learned | review"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "status": "learned | review",
    "next_review_at": "timestamp | null"
  }
  ```
- **Success Codes**:
  - 200: Flashcard status updated successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 404: Flashcard not found
  - 500: Server error

#### Get Flashcards Due for Review

- **Method**: GET
- **Path**: `/api/flashcards/due`
- **Description**: Get all flashcards due for review
- **Query Parameters**:
  - `limit` (integer, optional): Number of records to return (default: 20)
  - `collection_id` (uuid, optional): Filter by collection
  - `category_id` (uuid, optional): Filter by category
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "next_review_at": "timestamp"
      }
    ]
  }
  ```
- **Success Codes**:
  - 200: Flashcards retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

### AI Flashcard Generation

#### Generate Flashcards

- **Method**: POST
- **Path**: `/api/ai/generate-flashcards`
- **Description**: Generate flashcards from text input using AI
- **Request Body**:
  ```json
  {
    "text": "string",
    "collection_id": "uuid | null",
    "category_id": "uuid | null"
  }
  ```
- **Response**:
  ```json
  {
    "flashcards": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null"
      }
    ]
  }
  ```
- **Implementation Notes**: 
  - Unique UUIDs are generated on the server for each flashcard
  - These UUIDs are temporary until flashcards are permanently saved
  - The first flashcard generation for a user automatically creates a stats record
- **Success Codes**:
  - 200: Flashcards generated successfully
- **Error Codes**:
  - 400: Invalid request body (text length outside of 1000-10000 characters)
  - 401: Unauthorized
  - 404: Collection or category not found (if IDs provided)
  - 500: Server error

#### Accept Generated Flashcards

- **Method**: POST
- **Path**: `/api/ai/flashcards/accept`
- **Description**: Accept and save generated flashcards
- **Request Body**:
  ```json
  {
    "flashcards": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null",
        "was_edited": "boolean"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "collection_id": "uuid | null",
        "category_id": "uuid | null",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "stats": {
      "total_accepted": "integer",
      "direct_accepted": "integer",
      "edited_accepted": "integer"
    }
  }
  ```
- **Success Codes**:
  - 201: Flashcards saved successfully
- **Error Codes**:
  - 400: Invalid request body
  - 401: Unauthorized
  - 500: Server error

### Flashcard Generation Stats

#### Get Flashcard Generation Stats

- **Method**: GET
- **Path**: `/api/stats/generation`
- **Description**: Get statistics about AI-generated flashcards
- **Implementation Notes**:
  - Stats record is automatically created on first flashcard generation
  - Acceptance rate is calculated as (total_accepted_direct + total_accepted_edited) / total_generated
  - If no flashcards have been generated yet, endpoint returns default values with zeroes
- **Response**:
  ```json
  {
    "total_generated": "integer",
    "total_accepted_direct": "integer",
    "total_accepted_edited": "integer",
    "acceptance_rate": "float",
    "last_generation_at": "timestamp | null"
  }
  ```
- **Success Codes**:
  - 200: Stats retrieved successfully
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

## 3. Authentication and Authorization

### Authentication Mechanism

The application uses Supabase for authentication, which provides:

- **Email/Password Authentication**: Standard email and password sign-up/login
- **Social Authentication**: Optional OAuth integration with providers like Google, Facebook, etc.
- **JWT Tokens**: Secure JSON Web Tokens for maintaining sessions
- **Authorization Headers**: API requests authenticated using the `Authorization: Bearer <token>` header

### Implementation Details

1. **Client-Side Authentication Flow**:
   - User signs in through Supabase Auth UI or custom forms
   - JWT token is stored securely (HTTP-only cookies)
   - Token is sent with each API request in the Authorization header

2. **Server-Side Verification**:
   - Middleware validates the JWT token on each request
   - User identity is extracted from the token and made available to API handlers
   - Requests without valid tokens are rejected with 401 Unauthorized

3. **Row-Level Security (RLS)**:
   - Supabase RLS policies ensure users can only access their own data
   - API further enforces this by checking user IDs against resource ownership

4. **Account Deletion**:
   - When a user requests account deletion, confirmation is required
   - All user data is cascaded and deleted from the database

## 4. Validation and Business Logic

### Validation Rules

#### Collections
- `name`: Required, maximum 100 characters
- `description`: Optional, maximum 500 characters

#### Categories
- `name`: Required, maximum 50 characters, unique per user
- `description`: Optional, maximum 200 characters

#### Flashcards
- `front`: Required, maximum 200 characters
- `back`: Required, maximum 500 characters
- `collection_id`: Optional, must reference a valid collection owned by the user
- `category_id`: Optional, must reference a valid category owned by the user

### Business Logic Implementation

1. **AI Flashcard Generation**:
   - Input text must be between 1000-10000 characters
   - 5-15 candidate flashcards are generated
   - Flashcards are validated against length constraints before being presented to the user

2. **Flashcard Acceptance Process**:
   - User can accept, edit then accept, or reject each generated flashcard
   - Bulk saving of accepted flashcards is performed in a single operation
   - Statistics are updated to track acceptance rates

3. **Spaced Repetition Logic**:
   - Integrated with open-source spaced repetition algorithm
   - Flashcards are scheduled for review based on user learning progress
   - API provides endpoints to mark cards as learned or requiring review

4. **Statistics Gathering**:
   - System tracks statistics about AI-generated flashcards
   - Calculates metrics such as acceptance rate and generation effectiveness
   - These statistics are used to measure success against the 75% acceptance target

5. **Data Privacy and Security**:
   - User data is stored in compliance with GDPR
   - User has the right to access and delete all their data
   - Account deletion includes removal of all associated flashcards, collections, and categories 