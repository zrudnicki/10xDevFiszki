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