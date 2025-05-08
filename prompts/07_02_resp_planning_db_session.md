<database_planning_output>
<pytania>
Jakie kategorie fiszek będą dostępne w systemie? Czy będą to stałe kategorie, czy użytkownicy będą mogli tworzyć własne?
Czy potrzebujemy przechowywać informacje o statusie fiszek (np. aktywne, zarchiwizowane)?
Czy potrzebujemy mechanizmu do masowego importu/eksportu fiszek?
Jak często użytkownicy będą modyfikować istniejące fiszki?
Czy potrzebujemy systemu wersjonowania dla kolekcji fiszek?
Jakie metadane powinniśmy przechowywać dla każdej fiszki (np. data utworzenia, ostatnia modyfikacja)?
Czy potrzebujemy mechanizmu do łączenia/łączenia kolekcji fiszek?
Jakie są wymagania dotyczące czasu odpowiedzi dla operacji na fiszkach?
</pytania>
<rekomendacje>
Zaimplementuj partycjonowanie tabeli fiszek według kategorii dla optymalizacji wydajności przy dużej liczbie rekordów.
Użyj indeksów częściowych dla często używanych filtrów (np. aktywne fiszki).
Zaimplementuj mechanizm buforowania dla często używanych kolekcji fiszek.
Użyj materializowanych widoków dla często wykonywanych zapytań agregujących.
Zaimplementuj mechanizm czyszczenia nieużywanych kolekcji.
Użyj kompresji dla tabel z historycznymi danymi.
Zaimplementuj mechanizm monitorowania wydajności zapytań.
Użyj mechanizmu kolejkowania dla operacji masowych.
</rekomendacje>
</database_planning_output>