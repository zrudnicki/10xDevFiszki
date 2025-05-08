<database_planning_output>
<pytania>
Czy użytkownicy powinni mieć możliwość organizowania fiszek w kolekcje/zestawy, czy wystarczy prosta lista wszystkich fiszek?
Czy potrzebujemy przechowywać historię zmian fiszek (np. kto i kiedy edytował)?
Jak długo powinniśmy przechowywać dane użytkowników po usunięciu konta?
Czy potrzebujemy przechowywać statystyki nauki dla każdej fiszki (np. liczba powtórzeń, skuteczność)?
Czy potrzebujemy system tagów dla fiszek, czy wystarczy prosta kategoryzacja?
Jak często użytkownicy będą generować nowe fiszki przez AI?
Czy potrzebujemy przechowywać oryginalny tekst wejściowy użyty do generowania fiszek?
Jakie są oczekiwane wolumeny danych (liczba użytkowników, fiszek na użytkownika)?
</pytania>
<rekomendacje>
Użyj UUID jako kluczy głównych dla wszystkich tabel dla lepszej skalowalności i bezpieczeństwa.
Zaimplementuj Row Level Security (RLS) dla wszystkich tabel, aby użytkownicy mieli dostęp tylko do swoich danych.
Utwórz indeksy na często używanych kolumnach wyszukiwania (np. user_id, created_at).
Użyj typów danych:
UUID dla identyfikatorów
TIMESTAMP WITH TIME ZONE dla dat
TEXT dla treści fiszek (zamiast VARCHAR)
JSONB dla metadanych i statystyk
Zaimplementuj soft delete dla fiszek i kont użytkowników.
Użyj partycjonowania tabeli fiszek według user_id dla lepszej wydajności przy dużej liczbie użytkowników.
Zaimplementuj mechanizm archiwizacji starych danych.
Użyj transakcji dla operacji modyfikujących wiele tabel.
</rekomendacje>
</database_planning_output>