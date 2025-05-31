# Database Planning Summary - 10xDevFiszki

## Decisions Made

1. Fiszki bez wersjonowania - nie śledzić historii edycji
2. Przechowywać tylko aktualne parametry SM-2, bez pełnej historii odpowiedzi
3. Statystyki generowania fiszek na poziomie użytkownika (agregowane)
4. Hard delete dla kont użytkowników zgodnie z RODO
5. Kolekcje i kategorie nie współdzielone między użytkownikami
6. Fiszki kandydaci (przed akceptacją) przechowywane tylko w sesji
7. Brak potrzeby partycjonowania tabeli fiszek
8. Brak auditowania zmian
9. Usunięcie kolekcji usuwa wszystkie powiązane fiszki
10. Przechowywać historyczne dane w generation_stats dla metryk sukcesu
11. Zagregowane dane w study_sessions zamiast szczegółowych logów
12. Aktualizować last_generation_at przy każdym generowaniu dla metryk
13. Nazwy kolekcji unikalne per użytkownik
14. Indeks na next_review_date dla wydajności
15. Limit 250 znaków dla nazw kolekcji i kategorii
16. Logować sesje nauki dla metryk czasu przeglądu
17. Brak pola difficulty/priority dla fiszek
18. Fiszka należy do jednej kategorii
19. Mierzyć czas od wyświetlenia fiszki do odpowiedzi
20. Kontynuować sesje zamiast tworzyć nowe
21. Liczyć tylko aktywne fiszki dla metryki "75% z AI"
22. Kategorie z user_id (prywatne per użytkownik)
23. Next_review_date domyślnie na jutro dla nowych fiszek
24. Przechowywać daty w UTC
25. Stan sesji bazuje na enum SessionStatus
26. Aktualizować ended_at przy każdej fiszce w sesji
27. Automatycznie kończyć sesje po timeout
28. Default next_review_date: CURRENT_DATE + INTERVAL '1 day'
29. Incrementować total_generated tylko przy successful generation
30. Resetować flashcards_reviewed_count przy soft restart
31. Indeks na collections(user_id, name) dla unikalności

## Matched Recommendations

1. Użyj UUID jako klucze główne dla lepszej skalowalności
2. Implementuj Row Level Security (RLS) w Supabase dla izolacji danych użytkowników
3. Dodaj CHECK constraints na długość pól front (≤200) i back (≤500 znaków)
4. Dodaj timestamps (created_at, updated_at) do wszystkich tabel
5. Użyj enum types dla statusów fiszek i odpowiedzi nauki
6. Implementuj CASCADE DELETE dla relacji collections -> flashcards
7. Default values dla SM-2: easiness_factor = 2.5, interval = 1, repetitions = 0
8. Unique constraint na (user_id, collection_name)
9. Default value next_review_date: (CURRENT_DATE + INTERVAL '1 day')::timestamptz
10. Trigger BEFORE INSERT na flashcards dla automatycznego ustawienia next_review_date
11. Unique constraint na categories(user_id, name)
12. Function update_generation_stats() jako trigger dla automatycznych aktualizacji
13. Tabela study_sessions z SessionStatus enum (active, completed, abandoned)
14. Index na study_sessions(user_id, started_at DESC)
15. Composite index na (user_id, next_review_date, status)

## Database Planning Summary

### Główne wymagania schematu bazy danych

Aplikacja 10xDevFiszki wymaga bazy danych PostgreSQL wspierającej:
- Zarządzanie fiszkami z AI generowaniem i ręcznym tworzeniem
- System powtórek oparty na algorytmie SM-2
- Śledzenie statystyk dla metryk sukcesu (75% akceptacji AI, czas przeglądu <2min)
- Pełna izolacja danych użytkowników zgodnie z RODO

### Kluczowe encje i relacje

**Users** (zarządzane przez Supabase Auth)
- Basis dla RLS policies

**Collections**
- user_id (FK), name (max 250 chars), timestamps
- Unique constraint: (user_id, name)
- CASCADE DELETE do flashcards

**Categories** 
- user_id (FK), name (max 250 chars), timestamps
- Unique constraint: (user_id, name)
- Płaska struktura bez hierarchii

**Flashcards**
- user_id (FK), collection_id (FK), category_id (FK optional)
- front (≤200 chars), back (≤500 chars)
- SM-2 parameters: easiness_factor, interval, repetitions
- next_review_date (default: tomorrow UTC)
- created_by enum (manual, ai_generated)

**Study_Sessions**
- user_id (FK), collection_id (FK)
- started_at, ended_at (updated per flashcard)
- flashcards_reviewed_count, status enum
- Wspiera kontynuację sesji i timeout handling

**Flashcard_Generation_Stats**
- user_id (FK), total_generated, total_accepted_direct, total_accepted_edited
- last_generation_at dla śledzenia metryk
- Aktualizowane triggerami

### Bezpieczeństwo i skalowalność

- **RLS policies** na wszystkich tabelach z user_id
- **UUID primary keys** dla lepszej skalowalności
- **Composite indexes** na często używanych kombinacjach (user_id + inne pola)
- **CHECK constraints** na poziomie bazy dla walidacji długości pól
- **Hard delete** zgodnie z RODO bez dodatkowego auditowania

### Optymalizacja wydajności

- Index na next_review_date dla szybkiego pobierania fiszek do powtórki
- Partial index na aktywne sesje
- Triggers dla automatycznych aktualizacji statystyk
- TIMESTAMPTZ dla właściwej obsługi stref czasowych

## Unresolved Issues

1. Mechanizm rozwiązywania pustych kolekcji podczas sesji nauki - wymaga propozycji konkretnego rozwiązania
2. Dokładna specyfikacja timeout values dla automatycznego kończenia sesji
3. Szczegóły implementacji function get_cards_for_review() dla algorytmu SM-2
4. Strategia backup i retention zgodna z RODO - nie została szczegółowo omówiona
5. Konkretne wartości dla CHECK constraints na easiness_factor algorytmu SM-2
6. Obsługa edge cases gdy next_review_date jest w przeszłości przy długiej nieaktywności 