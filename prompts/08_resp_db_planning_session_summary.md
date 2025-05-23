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
