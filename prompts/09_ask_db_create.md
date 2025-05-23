Jesteś architektem baz danych, którego zadaniem jest stworzenie schematu bazy danych PostgreSQL na podstawie informacji dostarczonych z sesji planowania, dokumentu wymagań produktu (PRD) i stacku technologicznym. Twoim celem jest zaprojektowanie wydajnej i skalowalnej struktury bazy danych, która spełnia wymagania projektu.

1. <prd>
   @prd.md
   </prd>

Jest to dokument wymagań produktu, który określa cechy, funkcjonalności i wymagania projektu.

2. <session_notes>
   <conversation_summary>
   <decisions>
   Użytkownicy będą mogli organizować fiszki w kolekcje/zestawy
   Nie będzie przechowywania historii zmian fiszek
   Dane użytkowników będą usuwane natychmiast po usunięciu konta
   Nie będzie przechowywania statystyk nauki dla fiszek
   Będzie prosta kategoryzacja fiszek (bez systemu tagów)
   Użytkownicy mogą generować fiszki przez AI dowolnie często
   Nie będzie przechowywania oryginalnego tekstu wejściowego
   Przewidywana skala: 10,000 użytkowników i 10,000,000 fiszek
   Nie będzie mechanizmu automatycznego czyszczenia kolekcji
   Nie będzie mechanizmu eksportu danych
   Nie będzie mechanizmu archiwizacji
   Nie będzie mechanizmu masowego przenoszenia fiszek
   </decisions>
   <matched_recommendations>
   Użyj UUID jako kluczy głównych dla wszystkich tabel
   Zaimplementuj Row Level Security (RLS) dla wszystkich tabel
   Utwórz indeksy na kolumnach user_id i created_at
   Użyj typów danych:
   UUID dla identyfikatorów
   TIMESTAMP WITH TIME ZONE dla dat
   TEXT dla treści fiszek
   Zaimplementuj partycjonowanie tabeli fiszek według user_id
   Użyj transakcji dla operacji modyfikujących wiele tabel
   </matched_recommendations>
   <database_planning_summary>
   Główne wymagania dotyczące schematu bazy danych:
   Prosty model z dwoma głównymi encjami: Users i FlashCards
   Kolekcje fiszek jako dodatkowa encja
   Brak skomplikowanych mechanizmów archiwizacji i historii
   Kluczowe encje i relacje:
   Users (1) -> FlashCards (N)
   Users (1) -> Collections (N)
   Collections (1) -> FlashCards (N)
   Bezpieczeństwo i skalowalność:
   Row Level Security dla izolacji danych użytkowników
   Partycjonowanie tabeli fiszek według user_id
   Indeksy na kluczowych kolumnach wyszukiwania
   UUID jako klucze główne dla lepszej skalowalności
   Wydajność:
   Optymalizacja pod kątem dużej liczby fiszek (10M)
   Proste zapytania bez skomplikowanych agregacji
   Brak mechanizmów buforowania i replikacji
   </database_planning_summary>
   <unresolved_issues>
   Dokładna struktura kategorii fiszek
   Maksymalna liczba fiszek w kolekcji
   Maksymalna liczba kolekcji na użytkownika
   Strategia backupu danych
   </unresolved_issues>
   </conversation_summary>
   </session_notes>

Są to notatki z sesji planowania schematu bazy danych. Mogą one zawierać ważne decyzje, rozważania i konkretne wymagania omówione podczas spotkania.

3. <tech_stack>
   @tech-stack.md
   </tech_stack>

Opisuje stack technologiczny, który zostanie wykorzystany w projekcie, co może wpłynąć na decyzje dotyczące projektu bazy danych.

Wykonaj następujące kroki, aby utworzyć schemat bazy danych:

1. Dokładnie przeanalizuj notatki z sesji, identyfikując kluczowe jednostki, atrybuty i relacje omawiane podczas sesji planowania.
2. Przejrzyj PRD, aby upewnić się, że wszystkie wymagane funkcje i funkcjonalności są obsługiwane przez schemat bazy danych.
3. Przeanalizuj stack technologiczny i upewnij się, że projekt bazy danych jest zoptymalizowany pod kątem wybranych technologii.

4. Stworzenie kompleksowego schematu bazy danych, który obejmuje
   a. Tabele z odpowiednimi nazwami kolumn i typami danych
   b. Klucze podstawowe i klucze obce
   c. Indeksy poprawiające wydajność zapytań
   d. Wszelkie niezbędne ograniczenia (np. unikalność, not null)

5. Zdefiniuj relacje między tabelami, określając kardynalność (jeden-do-jednego, jeden-do-wielu, wiele-do-wielu) i wszelkie tabele łączące wymagane dla relacji wiele-do-wielu.

6. Opracowanie zasad PostgreSQL dla zabezpieczeń na poziomie wiersza (RLS), jeśli dotyczy, w oparciu o wymagania określone w notatkach z sesji lub PRD.

7. Upewnij się, że schemat jest zgodny z najlepszymi praktykami projektowania baz danych, w tym normalizacji do odpowiedniego poziomu (zwykle 3NF, chyba że denormalizacja jest uzasadniona ze względu na wydajność).

Ostateczny wynik powinien mieć następującą strukturę:

```markdown
1. Lista tabel z ich kolumnami, typami danych i ograniczeniami
2. Relacje między tabelami
3. Indeksy
4. Zasady PostgreSQL (jeśli dotyczy)
5. Wszelkie dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych
```

W odpowiedzi należy podać tylko ostateczny schemat bazy danych w formacie markdown, który zapiszesz w pliku .ai/db-plan.md bez uwzględniania procesu myślowego lub kroków pośrednich. Upewnij się, że schemat jest kompleksowy, dobrze zorganizowany i gotowy do wykorzystania jako podstawa do tworzenia migracji baz danych.
