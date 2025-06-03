Jesteś doświadczonym programistą implementującym REST API. Twoim zadaniem jest wdrożenie endpointa interfejsu API REST w oparciu o podany plan wdrożenia. Twoim celem jest stworzenie solidnej i dobrze zorganizowanej implementacji, która zawiera odpowiednią walidację, obsługę błędów i podąża za wszystkimi logicznymi krokami opisanymi w planie.

Najpierw dokładnie przejrzyj dostarczony plan wdrożenia:

<implementation_plan>
@api-flashcards-implementation-plan.md
</implementation_plan>

<types>
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
      }
      flashcard_generation_stats: {
        Row: {
          created_at: string
          last_generation_at: string | null
          total_accepted_direct: number
          total_accepted_edited: number
          total_generated: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_generation_at?: string | null
          total_accepted_direct?: number
          total_accepted_edited?: number
          total_generated?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_generation_at?: string | null
          total_accepted_direct?: number
          total_accepted_edited?: number
          total_generated?: number
          updated_at?: string
          user_id?: string
        }
      }
      flashcards: {
        Row: {
          back: string
          category_id: string | null
          collection_id: string
          created_at: string
          created_by: Database["public"]["Enums"]["flashcard_created_by"]
          easiness_factor: number
          front: string
          id: string
          interval: number
          next_review_date: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          category_id?: string | null
          collection_id: string
          created_at?: string
          created_by?: Database["public"]["Enums"]["flashcard_created_by"]
          easiness_factor?: number
          front: string
          id?: string
          interval?: number
          next_review_date?: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          category_id?: string | null
          collection_id?: string
          created_at?: string
          created_by?: Database["public"]["Enums"]["flashcard_created_by"]
          easiness_factor?: number
          front?: string
          id?: string
          interval?: number
          next_review_date?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
      }
      study_sessions: {
        Row: {
          collection_id: string
          created_at: string
          ended_at: string | null
          flashcards_reviewed_count: number
          id: string
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          ended_at?: string | null
          flashcards_reviewed_count?: number
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          ended_at?: string | null
          flashcards_reviewed_count?: number
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id?: string
        }
      }
    }
    Enums: {
      flashcard_created_by: "manual" | "ai_generated"
      session_status: "active" | "completed" | "abandoned"
    }
  }
}
```
</types>

<implementation_rules>
# Supabase Astro Initialization

## Prerequisites
- Your project should use Astro 5, TypeScript 5, React 19, and Tailwind 4.
- Install the `@supabase/supabase-js` package.
- Ensure that `/supabase/config.toml` exists
- Ensure that a file `/src/db/database.types.ts` exists and contains the correct type definitions for your database.

## File Structure and Setup

### 1. Supabase Client Initialization
Create the file `/src/db/supabase.client.ts` with the following content:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### 2. Middleware Setup
Create the file `/src/middleware/index.ts` with the following content:

```ts
import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

### 3. TypeScript Environment Definitions
Create the file `src/env.d.ts` with the following content:

```ts
/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

# AI Rules for Fiszki

## Tech Stack
- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui

## Project Structure
When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers 
- `./src/assets` - static internal assets
- `./public` - public assets

## Coding practices

### Guidelines for clean code
- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

### Backend and Database
- Use Supabase for backend services, including authentication and database interactions.
- Follow Supabase guidelines for security and performance.
- Use Zod schemas to validate data exchanged with the backend.
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

### Guidelines for Astro
- Leverage View Transitions API for smooth page transitions (use ClientRouter)
- Use content collections with type safety for blog posts, documentation, etc.
- Leverage Server Endpoints for API routes
- Use POST, GET - uppercase format for endpoint handlers
- Use `export const prerender = false` for API routes
- Use zod for input validation in API routes
- Extract logic into services in `src/lib/services`
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables
</implementation_rules>

<implementation_approach>
Realizuj maksymalnie 3 kroki planu implementacji, podsumuj krótko co zrobiłeś i opisz plan na 3 kolejne działania - zatrzymaj w tym momencie pracę i czekaj na mój feedback.
</implementation_approach>

Teraz wykonaj następujące kroki, aby zaimplementować punkt końcowy interfejsu API REST:

1. Przeanalizuj plan wdrożenia:
   - Określ metodę HTTP (GET, POST, PUT, DELETE itp.) dla punktu końcowego.
   - Określenie struktury adresu URL punktu końcowego
   - Lista wszystkich oczekiwanych parametrów wejściowych
   - Zrozumienie wymaganej logiki biznesowej i etapów przetwarzania danych
   - Zwróć uwagę na wszelkie szczególne wymagania dotyczące walidacji lub obsługi błędów.

2. Rozpocznij implementację:
   - Rozpocznij od zdefiniowania funkcji punktu końcowego z prawidłowym dekoratorem metody HTTP.
   - Skonfiguruj parametry funkcji w oparciu o oczekiwane dane wejściowe
   - Wdrożenie walidacji danych wejściowych dla wszystkich parametrów
   - Postępuj zgodnie z logicznymi krokami opisanymi w planie wdrożenia
   - Wdrożenie obsługi błędów dla każdego etapu procesu
   - Zapewnienie właściwego przetwarzania i transformacji danych zgodnie z wymaganiami
   - Przygotowanie struktury danych odpowiedzi

3. Walidacja i obsługa błędów:
   - Wdrożenie dokładnej walidacji danych wejściowych dla wszystkich parametrów
   - Używanie odpowiednich kodów statusu HTTP dla różnych scenariuszy (np. 400 dla błędnych żądań, 404 dla nie znaleziono, 500 dla błędów serwera).
   - Dostarczanie jasnych i informacyjnych komunikatów o błędach w odpowiedzi.
   - Obsługa potencjalnych wyjątków, które mogą wystąpić podczas przetwarzania.

4. Rozważania dotyczące testowania:
   - Należy rozważyć edge case'y i potencjalne problemy, które powinny zostać przetestowane.
   - Upewnienie się, że wdrożenie obejmuje wszystkie scenariusze wymienione w planie.

5. Dokumentacja:
   - Dodaj jasne komentarze, aby wyjaśnić złożoną logikę lub ważne decyzje
   - Dołącz dokumentację dla głównej funkcji i wszelkich funkcji pomocniczych.

Kod powinien być poprawnie sformatowany z godnie z regółami podanymi w @.prettierrc.json , eslint.config.js oraz <implementation_rules>

Po zakończeniu implementacji upewnij się, że zawiera wszystkie niezbędne importy, definicje funkcji i wszelkie dodatkowe funkcje pomocnicze lub klasy wymagane do implementacji.

Jeśli musisz przyjąć jakieś założenia lub masz jakiekolwiek pytania dotyczące planu implementacji, przedstaw je przed pisaniem kodu.

Pamiętaj, aby przestrzegać najlepszych praktyk projektowania REST API, stosować się do wytycznych dotyczących stylu języka programowania podanych w @prettierrc.json, @eslint.config.js i upewnić się, że kod jest czysty, czytelny i dobrze zorganizowany. 