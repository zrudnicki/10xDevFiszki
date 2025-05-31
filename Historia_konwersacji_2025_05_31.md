# Historia Konwersacji - 31 maja 2025
## Projekt: 10xDevFiszki - Polska aplikacja do nauki z fiszkami AI

---

## Faza 1: Rozwiązywanie problemów technicznych

### Problem 1: Błędy importu CSS
**Problem:** Błędy związane z importem `global.css` w komponencie Astro
**Rozwiązanie:** Przejście na czyste Tailwind CSS bez dodatkowych plików CSS

### Problem 2: Błędy składni przekierowań Astro
**Problem:** Nieprawidłowa składnia `Astro.redirect()` w pliku `review.astro`
**Rozwiązanie:** Usunięcie problematycznego pliku i naprawienie składni

### Problem 3: Konfiguracja Tailwind CSS
**Problem:** Brak odpowiedniej konfiguracji Tailwind z CSS variables
**Rozwiązanie:** Utworzenie kompletnej konfiguracji `tailwind.config.mjs` z:
- CSS variables dla kolorów
- Konfiguracja dark mode
- Własne kolory dla aplikacji
- Animacje i effects

---

## Faza 2: Dokumentacja projektu

### Aktualizacja README.md
**Cel:** Tłumaczenie dokumentacji na język polski i kompletny opis projektu
**Zawartość:**
- Opis aplikacji w języku polskim
- Stack technologiczny (Astro 5, React 19, TypeScript 5, Tailwind 4, Supabase)
- Instrukcje instalacji i uruchomienia
- Główne funkcje aplikacji
- Struktura projektu

### Utworzenie source-documentation.md
**Cel:** Szczegółowa dokumentacja struktury kodu
**Zawartość:**
- Opis każdego katalogu w projekcie
- Odpowiedzialność poszczególnych plików
- Konwencje nazewnictwa
- Wzorce architektoniczne

### Diagram przepływu aplikacji (Mermaid)
**Cel:** Wizualizacja głównych procesów w aplikacji
**Zawartość:**
- Przepływ rejestracji i logowania
- Proces tworzenia fiszek (AI + manualne)
- System sesji nauki i powtórek
- Zarządzanie kontem użytkownika

---

## Faza 3: Intensywna sesja planowania bazy danych

### Proces planowania (31 pytań i odpowiedzi)

#### Pytania 1-10: Podstawowe decyzje architektoniczne
1. **Wersjonowanie fiszek:** NIE - tylko aktualna wersja
2. **Historia odpowiedzi:** NIE - tylko parametry SM-2
3. **Statystyki generowania:** Zagregowane na poziomie użytkownika
4. **Usuwanie kont:** Hard delete zgodnie z RODO
5. **Współdzielenie kolekcji:** NIE - prywatne per użytkownik
6. **Fiszki kandydaci:** Tylko w sesji, nie w bazie
7. **Partycjonowanie:** NIE dla MVP
8. **Auditowanie:** NIE dla MVP
9. **Usuwanie kolekcji:** CASCADE DELETE do fiszek
10. **Dane historyczne:** Tylko zagregowane statystyki

#### Pytania 11-20: Szczegóły implementacji
11. **Logowanie sesji:** Zagregowane dane w study_sessions
12. **Aktualizacja last_generation_at:** Przy każdym generowaniu
13. **Nazwy kolekcji:** Unikalne per użytkownik
14. **Indeksy:** Przede wszystkim next_review_date
15. **Limity znaków:** Kolekcje/kategorie 250, front 200, back 500
16. **Sesje nauki:** TAK dla metryk czasowych
17. **Pole difficulty:** NIE - SM-2 zarządza priorytetami
18. **Kategorie fiszek:** One-to-many (jedna kategoria na fiszkę)
19. **Pomiar czasu:** Od wyświetlenia do odpowiedzi
20. **Sesje:** Kontynuować zamiast tworzyć nowe

#### Pytania 21-31: Finalizacja szczegółów
21. **Metryka "75% z AI":** Tylko aktywne fiszki
22. **User_id w kategoriach:** TAK - prywatne per użytkownik
23. **Default next_review_date:** Jutro (CURRENT_DATE + 1 day)
24. **Strefa czasowa:** UTC (TIMESTAMPTZ)
25. **Stany sesji:** Enum (active, completed, abandoned)
26. **Aktualizacja ended_at:** Przy każdej fiszce
27. **Timeout sesji:** Automatyczne 'abandoned'
28. **Trigger next_review_date:** BEFORE INSERT z defaultem
29. **Total_generated:** Tylko przy successful generation
30. **Soft restart:** Reset flashcards_reviewed_count
31. **Indeksy unikalności:** Composite na (user_id, name)

### Kluczowe decyzje architektoniczne

#### Zasady projektowe:
1. **Prostota MVP** - rezygnacja z zaawansowanych funkcji
2. **Bezpieczeństwo** - RLS policies dla izolacji danych
3. **Wydajność** - przemyślane indeksowanie
4. **RODO compliance** - hard delete i prywatność
5. **Metryki sukcesu** - minimalne ale wystarczające śledzenie

#### Schema bazy danych:

**Users** (Supabase Auth)
- Podstawa dla RLS policies

**Collections**
- user_id (FK), name (250 chars), timestamps
- Unique: (user_id, name)
- CASCADE DELETE → flashcards

**Categories**
- user_id (FK), name (250 chars), timestamps  
- Unique: (user_id, name)
- Płaska struktura

**Flashcards**
- user_id (FK), collection_id (FK), category_id (FK optional)
- front (≤200), back (≤500)
- SM-2: easiness_factor=2.5, interval=1, repetitions=0
- next_review_date (default: tomorrow UTC)
- created_by enum (manual, ai_generated)

**Study_Sessions**
- user_id (FK), collection_id (FK)
- started_at, ended_at, flashcards_reviewed_count
- status enum (active, completed, abandoned)

**Flashcard_Generation_Stats**
- user_id (FK)
- total_generated, total_accepted_direct, total_accepted_edited
- last_generation_at

### Rekomendacje implementacyjne

#### Bezpieczeństwo i skalowalność:
- UUID primary keys
- Row Level Security na wszystkich tabelach
- CHECK constraints na długość pól
- Timestamps na wszystkich tabelach
- Enum types dla statusów

#### Optymalizacja:
- Composite indexes na często używanych kombinacjach
- Partial indexes dla aktywnych sesji
- Triggers dla automatycznych aktualizacji
- Default values dla SM-2 parametrów

---

## Faza 4: Dokumentacja finalna

### Utworzone pliki dokumentacji:
1. **db-plan.md** - Kompletny plan architektury bazy danych
2. **sesja-planistyczna-db.md** - Q&A z sesji planowania
3. **source-documentation.md** - Dokumentacja struktury kodu
4. **README.md** - Zaktualizowana dokumentacja projektu

### Nierozwiązane kwestie do dalszej pracy:
1. Mechanizm obsługi pustych kolekcji podczas sesji nauki
2. Dokładne wartości timeout dla sesji
3. Szczegóły implementacji algorytmu SM-2
4. Strategia backup i retention zgodna z RODO
5. Ograniczenia CHECK dla easiness_factor
6. Obsługa przeterminowanych dat przeglądu

---

## Podsumowanie sesji

### Osiągnięcia:
- ✅ Rozwiązano wszystkie błędy techniczne w kodzie
- ✅ Kompletna dokumentacja projektu w języku polskim
- ✅ Szczegółowy plan architektury bazy danych (31 decyzji)
- ✅ Gotowy schemat dla implementacji MVP
- ✅ Identyfikacja obszarów wymagających dalszej pracy

### Następne kroki:
1. Implementacja schematu bazy danych w Supabase
2. Rozwiązanie nierozwiązanych kwestii technicznych
3. Implementacja funkcji AI generowania fiszek
4. Implementacja algorytmu SM-2 dla powtórek
5. Testy i optymalizacja wydajności

### Metryki sukcesu MVP:
- 75% akceptacji fiszek generowanych przez AI
- 75% wszystkich fiszek pochodzących z AI
- Średni czas przeglądu fiszek poniżej 2 minut

---

## Stos technologiczny

**Frontend:**
- Astro 5 (SSG/SSR)
- React 19 (komponenty interaktywne)
- TypeScript 5
- Tailwind CSS 4

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- OPENROUTER.ai (generowanie fiszek)

**Deployment:**
- Vercel (hosting)
- Edge functions dla API

---

*Sesja przeprowadzona 31 maja 2025*
*Projekt: 10xDevFiszki - Polska aplikacja do nauki z fiszkami AI* 