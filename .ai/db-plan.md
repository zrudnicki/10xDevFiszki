# Schemat Bazy Danych PostgreSQL - 10xDevFiszki

## 1. Typy Enum

```sql
-- Status sesji nauki
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');

-- Sposób utworzenia fiszki
CREATE TYPE flashcard_created_by AS ENUM ('manual', 'ai_generated');
```

## 2. Tabele

### 2.1 Users
```sql
-- Zarządzane przez Supabase Auth
-- Tabela auth.users jest automatycznie tworzona przez Supabase
-- Używamy auth.uid() jako referencji w innych tabelach
```

### 2.2 Collections
```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT collections_name_length CHECK (length(name) <= 250),
    CONSTRAINT collections_user_name_unique UNIQUE (user_id, name)
);
```

### 2.3 Categories
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(250) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT categories_name_length CHECK (length(name) <= 250),
    CONSTRAINT categories_user_name_unique UNIQUE (user_id, name)
);
```

### 2.4 Flashcards
```sql
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    front VARCHAR(200) NOT NULL,
    back VARCHAR(500) NOT NULL,
    
    -- SM-2 Algorithm Parameters
    easiness_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 1,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ,
    
    created_by flashcard_created_by NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT flashcards_front_length CHECK (length(front) <= 200 AND length(front) > 0),
    CONSTRAINT flashcards_back_length CHECK (length(back) <= 500 AND length(back) > 0),
    CONSTRAINT flashcards_easiness_factor_range CHECK (easiness_factor >= 1.3 AND easiness_factor <= 2.5),
    CONSTRAINT flashcards_interval_positive CHECK (interval > 0),
    CONSTRAINT flashcards_repetitions_non_negative CHECK (repetitions >= 0)
);
```

### 2.5 Study_Sessions
```sql
CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    flashcards_reviewed_count INTEGER NOT NULL DEFAULT 0,
    status session_status NOT NULL DEFAULT 'active',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT study_sessions_flashcards_count_non_negative CHECK (flashcards_reviewed_count >= 0),
    CONSTRAINT study_sessions_ended_after_started CHECK (ended_at IS NULL OR ended_at >= started_at)
);
```

### 2.6 Flashcard_Generation_Stats
```sql
CREATE TABLE flashcard_generation_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    total_generated INTEGER NOT NULL DEFAULT 0,
    total_accepted_direct INTEGER NOT NULL DEFAULT 0,
    total_accepted_edited INTEGER NOT NULL DEFAULT 0,
    last_generation_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT generation_stats_totals_non_negative CHECK (
        total_generated >= 0 AND 
        total_accepted_direct >= 0 AND 
        total_accepted_edited >= 0
    ),
    CONSTRAINT generation_stats_accepted_not_exceed_generated CHECK (
        (total_accepted_direct + total_accepted_edited) <= total_generated
    )
);
```

## 3. Indeksy

```sql
-- Collections
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_user_created_at ON collections(user_id, created_at DESC);

-- Categories  
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Flashcards - indeksy wydajnościowe
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);
CREATE INDEX idx_flashcards_user_next_review ON flashcards(user_id, next_review_date);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);

-- Study Sessions
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_collection_id ON study_sessions(collection_id);
CREATE INDEX idx_study_sessions_user_started_at ON study_sessions(user_id, started_at DESC);
CREATE INDEX idx_study_sessions_status ON study_sessions(status) WHERE status = 'active';

-- Generation Stats
-- Primary key już zapewnia indeks na user_id
```

## 4. Row Level Security (RLS)

```sql
-- Włączenie RLS na wszystkich tabelach
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_generation_stats ENABLE ROW LEVEL SECURITY;

-- Polityki RLS - użytkownicy widzą tylko swoje dane
CREATE POLICY collections_user_isolation ON collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY categories_user_isolation ON categories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY flashcards_user_isolation ON flashcards
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY study_sessions_user_isolation ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY generation_stats_user_isolation ON flashcard_generation_stats
    FOR ALL USING (auth.uid() = user_id);
```

## 5. Triggery i Funkcje

```sql
-- Funkcja automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggery dla automatycznej aktualizacji updated_at
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_categories_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON study_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_stats_updated_at BEFORE UPDATE ON flashcard_generation_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funkcja inicjalizacji statystyk generowania dla nowego użytkownika
CREATE OR REPLACE FUNCTION initialize_user_generation_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO flashcard_generation_stats (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger dla automatycznej inicjalizacji statystyk przy rejestracji
CREATE TRIGGER initialize_generation_stats_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_user_generation_stats();
```

## 6. Relacje między tabelami

### 6.1 Kardynalność relacji
- **Users ↔ Collections**: 1:N (jeden użytkownik może mieć wiele kolekcji)
- **Users ↔ Categories**: 1:N (jeden użytkownik może mieć wiele kategorii)
- **Users ↔ Flashcards**: 1:N (jeden użytkownik może mieć wiele fiszek)
- **Users ↔ Study_Sessions**: 1:N (jeden użytkownik może mieć wiele sesji)
- **Users ↔ Flashcard_Generation_Stats**: 1:1 (jeden użytkownik ma jedne statystyki)
- **Collections ↔ Flashcards**: 1:N (jedna kolekcja może zawierać wiele fiszek)
- **Categories ↔ Flashcards**: 1:N (jedna kategoria może być przypisana do wielu fiszek)
- **Collections ↔ Study_Sessions**: 1:N (jedna kolekcja może mieć wiele sesji nauki)

### 6.2 Kaskadowe usuwanie
- Usunięcie użytkownika → usuwa wszystkie jego dane (CASCADE DELETE)
- Usunięcie kolekcji → usuwa wszystkie fiszki w kolekcji (CASCADE DELETE)
- Usunięcie kategorii → ustawia category_id na NULL w fiszkach (SET NULL)

## 7. Uwagi implementacyjne

### 7.1 Bezpieczeństwo
- Wszystkie tabele chronione przez RLS
- Izolacja danych na poziomie użytkownika
- Hard delete zgodny z RODO

### 7.2 Wydajność
- Indeksy na często używanych polach
- Partial index na aktywne sesje
- Composite indeksy dla złożonych zapytań

### 7.3 Skalowalność
- UUID jako klucze główne
- Możliwość horizontal scaling
- Optymalizacja dla Supabase

### 7.4 Integralność danych
- CHECK constraints na długości pól
- Walidacja parametrów SM-2
- Foreign key constraints z odpowiednim zachowaniem

### 7.5 Zgodność z wymaganiami MVP
- Prosta struktura bez nadmiernej złożoności
- Wspiera wszystkie funkcje z PRD
- Przygotowana na metryki sukcesu (75% akceptacji AI, czas <2min)

## 8. Przykładowe zapytania

```sql
-- Pobranie fiszek gotowych do powtórki dla użytkownika
SELECT f.* FROM flashcards f
WHERE f.user_id = auth.uid()
  AND f.next_review_date <= NOW()
ORDER BY f.next_review_date ASC;

-- Statystyki akceptacji AI dla użytkownika
SELECT 
    total_generated,
    total_accepted_direct,
    total_accepted_edited,
    CASE 
        WHEN total_generated > 0 
        THEN ROUND(((total_accepted_direct + total_accepted_edited)::DECIMAL / total_generated) * 100, 2)
        ELSE 0 
    END as acceptance_rate_percentage
FROM flashcard_generation_stats 
WHERE user_id = auth.uid();

-- Procent fiszek z AI
SELECT 
    COUNT(*) FILTER (WHERE created_by = 'ai_generated') as ai_generated_count,
    COUNT(*) as total_count,
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE created_by = 'ai_generated')::DECIMAL / COUNT(*)) * 100, 2)
        ELSE 0 
    END as ai_percentage
FROM flashcards 
WHERE user_id = auth.uid();
``` 