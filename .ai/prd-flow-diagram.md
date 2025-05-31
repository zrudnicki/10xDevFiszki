# Flow Diagram - 10xDevFiszki

```mermaid
flowchart TD
    Start([Start]) --> Auth{Authentication}
    Auth -->|Login| Dashboard
    Auth -->|Register| Register[Register Account]
    Register --> Dashboard

    Dashboard --> CreateFlashcards{Create Flashcards}
    Dashboard --> StudyFlashcards[Study Flashcards]
    Dashboard --> ViewStats[View Statistics]
    Dashboard --> AccountMgmt[Account Management]

    CreateFlashcards -->|AI Generation| AIInput[Input Text<br/>1000-10000 chars]
    CreateFlashcards -->|Manual Creation| ManualInput[Input Front/Back]

    AIInput --> AIGeneration[Generate 5-15<br/>Flashcard Candidates<br/><code>POST /api/generate-flashcards</code>]
    AIGeneration --> Review[Review Flashcards<br/><code>POST /api/flashcards/review</code>]

    ManualInput --> SaveFlashcard[Save to Collection<br/><code>POST /api/flashcards</code>]

    Review -->|Accept| SaveFlashcard
    Review -->|Needs Review| AIGeneration

    SaveFlashcard --> Collections[(Flashcard<br/>Collections<br/><code>GET /api/collections</code>)]

    StudyFlashcards --> SelectCollection[Select Collection<br/><code>GET /api/collections</code>]
    SelectCollection --> StartSession[Start Study Session<br/><code>POST /api/study-sessions</code>]
    StartSession --> StudySession[Study Session<br/><code>GET /api/study-sessions/ID</code>]
    StudySession -->|Answer Card| SubmitAnswer[Submit Answer<br/><code>PATCH /api/study-sessions/ID/answer</code>]
    SubmitAnswer --> UpdateSM2[Update SM-2<br/>Algorithm]
    UpdateSM2 --> NextCard{More Cards?}
    NextCard -->|Yes| StudySession
    NextCard -->|No| EndSession[End Session<br/><code>PATCH /api/study-sessions/ID/complete</code>]
    EndSession --> Collections

    ViewStats --> GetStats[Get User Stats<br/><code>GET /api/users/stats</code>]
    GetStats --> GenerationStats[AI Generation Stats]
    GetStats --> LearningStats[Learning Progress]

    AccountMgmt --> ManageCollections[Manage Collections<br/><code>CRUD /api/collections</code><br/><code>CRUD /api/categories</code>]
    AccountMgmt --> ManageFlashcards[Manage Flashcards<br/><code>CRUD /api/flashcards</code>]
    AccountMgmt -->|Delete Account| Confirmation{Confirm Delete}
    Confirmation -->|Yes| DeleteData[Delete User Data<br/><code>DELETE /api/users/account</code>]
    Confirmation -->|No| Dashboard
    AccountMgmt -->|View Data| GDPR[GDPR Data Access<br/><code>GET /api/users/stats</code>]

    style Start fill:#9cf
    style Dashboard fill:#f9f
    style Collections fill:#fcf
    style StudySession fill:#cfc
    style Review fill:#fcc
    style AIGeneration fill:#ffa
    style GetStats fill:#aff
```

## API Coverage Summary

| Function | API Endpoints | Status |
|----------|---------------|---------|
| **Authentication** | Supabase Auth | ✅ Covered |
| **Collections Management** | `CRUD /api/collections` | ✅ Covered |
| **Categories Management** | `CRUD /api/categories` | ✅ Covered |
| **Manual Flashcard Creation** | `POST /api/flashcards` | ✅ Covered |
| **AI Flashcard Generation** | `POST /api/generate-flashcards` | ✅ Covered |
| **AI Flashcard Review** | `POST /api/flashcards/review` | ✅ Covered |
| **Flashcard Management** | `CRUD /api/flashcards` | ✅ Covered |
| **Study Session Start** | `POST /api/study-sessions` | ✅ Covered |
| **Study Session Progress** | `GET /api/study-sessions/{id}` | ✅ Covered |
| **Submit Answers** | `PATCH /api/study-sessions/{id}/answer` | ✅ Covered |
| **End Study Session** | `PATCH /api/study-sessions/{id}/complete` | ✅ Covered |
| **User Statistics** | `GET /api/users/stats` | ✅ Covered |
| **Account Deletion** | `DELETE /api/users/account` | ✅ Covered |
| **GDPR Data Access** | `GET /api/users/stats` | ✅ Covered |

## Additional API Features

### Pagination & Filtering
- All `GET` endpoints support pagination (`limit`, `offset`)
- Flashcards filtering by collection, category, due status
- Collections and categories sorting options

### Error Handling
- Consistent error format across all endpoints
- Proper HTTP status codes (400, 401, 404, 409, 422, 429)
- Detailed validation error messages

### Rate Limiting
- AI Generation: 10 req/min per user
- Standard CRUD: 100 req/min per user
- Study Sessions: 5 concurrent active sessions

---

This diagram shows complete API coverage for all PRD functionalities with concise endpoint labels. 