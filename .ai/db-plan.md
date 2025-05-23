# Schema bazy danych PostgreSQL dla aplikacji Fiszki

## 1. Tabele

### users

This table is managed by Supabase Auth.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### collections

```sql
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT collections_name_length CHECK (char_length(name) <= 100),
    CONSTRAINT collections_description_length CHECK (char_length(description) <= 500)
);
```

### categories

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT categories_name_length CHECK (char_length(name) <= 50),
    CONSTRAINT categories_description_length CHECK (char_length(description) <= 200),
    CONSTRAINT categories_unique_name_per_user UNIQUE (user_id, name)
);
```

### flashcards

```sql
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT flashcards_front_length CHECK (char_length(front) <= 200),
    CONSTRAINT flashcards_back_length CHECK (char_length(back) <= 500)
) PARTITION BY HASH (user_id);
```

### flashcard_generation_stats

```sql
CREATE TABLE flashcard_generation_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_generated INTEGER NOT NULL DEFAULT 0,
    total_accepted_direct INTEGER NOT NULL DEFAULT 0,
    total_accepted_edited INTEGER NOT NULL DEFAULT 0,
    last_generation_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT flashcard_generation_stats_positive_numbers CHECK (
        total_generated >= 0 AND
        total_accepted_direct >= 0 AND
        total_accepted_edited >= 0 AND
        total_accepted_direct + total_accepted_edited <= total_generated
    )
);
```

## 2. Relacje

1. users -> collections (1:N)

   - Jeden użytkownik może mieć wiele kolekcji
   - Kolekcja należy do jednego użytkownika

2. users -> flashcards (1:N)

   - Jeden użytkownik może mieć wiele fiszek
   - Fiszka należy do jednego użytkownika

3. collections -> flashcards (1:N)

   - Jedna kolekcja może zawierać wiele fiszek
   - Fiszka może należeć do jednej kolekcji (opcjonalnie)

4. users -> flashcard_generation_stats (1:1)

   - Jeden użytkownik ma jeden rekord statystyk generowania

5. users -> categories (1:N)

   - Jeden użytkownik może mieć wiele kategorii
   - Kategoria należy do jednego użytkownika

6. categories -> flashcards (1:N)
   - Jedna kategoria może zawierać wiele fiszek
   - Fiszka może należeć do jednej kategorii (opcjonalnie)

## 3. Indeksy

```sql
-- Indeksy dla tabeli collections
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_created_at ON collections(created_at);

-- Indeksy dla tabeli categories
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_created_at ON categories(created_at);

-- Indeksy dla tabeli flashcards
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_collection_id ON flashcards(collection_id);
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);
CREATE INDEX idx_flashcards_created_at ON flashcards(created_at);

-- Indeksy dla tabeli flashcard_generation_stats
CREATE INDEX idx_flashcard_generation_stats_user_id ON flashcard_generation_stats(user_id);
```

## 4. Zasady Row Level Security (RLS)

```sql
-- Włączenie RLS dla wszystkich tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_generation_stats ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli users
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Polityki dla tabeli collections
CREATE POLICY "Users can view their own collections" ON collections
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON collections
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON collections
    FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla tabeli flashcards
CREATE POLICY "Users can view their own flashcards" ON flashcards
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own flashcards" ON flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flashcards" ON flashcards
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flashcards" ON flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- Polityki dla tabeli flashcard_generation_stats
CREATE POLICY "Users can view their own stats" ON flashcard_generation_stats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON flashcard_generation_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Polityki dla tabeli categories
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);
```

## 5. Uwagi i wyjaśnienia

1. **Partycjonowanie**

   - Tabela `flashcards` jest partycjonowana według `user_id` dla lepszej wydajności przy dużej liczbie fiszek
   - Zalecane utworzenie 16 partycji dla początkowej skali

2. **Ograniczenia długości**

   - Zgodnie z PRD, pola `front` i `back` mają ograniczenia długości
   - Dodatkowo dodano ograniczenia dla nazwy i opisu kolekcji

3. **Soft Delete**

   - Tabela `users` zawiera pole `deleted_at` dla implementacji soft delete
   - Pozostałe tabele używają CASCADE dla usuwania powiązanych danych

4. **Statystyki**

   - Tabela `flashcard_generation_stats` przechowuje szczegółowe statystyki generowania fiszek
   - Pozwala na śledzenie efektywności generowania AI poprzez rozróżnienie między:
     - `total_accepted_direct` - fiszki zaakceptowane bez edycji
     - `total_accepted_edited` - fiszki zaakceptowane po edycji
   - Dodano ograniczenie sprawdzające poprawność liczb (nieujemne i suma akceptacji nie większa niż wygenerowane)
   - Umożliwia weryfikację kryteriów sukcesu:
     - Procent akceptacji fiszek (suma `total_accepted_direct` i `total_accepted_edited` / `total_generated`)
     - Procent fiszek tworzonych przez AI (suma akceptacji / całkowita liczba fiszek użytkownika)

5. **Kategoryzacja**

   - Dedykowana tabela `categories` dla lepszej organizacji fiszek
   - Unikalne nazwy kategorii na poziomie użytkownika
   - Kategorie są opcjonalne dla fiszek (ON DELETE SET NULL)
   - Indeksy na `category_id` dla szybszego wyszukiwania
   - RLS zapewnia izolację kategorii między użytkownikami

6. **Timestamps**
   - Wszystkie tabele zawierają pola `created_at`
