# Sesja Planistyczna Bazy Danych - 10xDevFiszki

## Q&A z sesji planowania architektury bazy danych

### Q1: Czy potrzebujemy śledzić historię edycji fiszek (wersjonowanie)?
**A:** Nie, dla MVP nie jest to potrzebne. Przechowujemy tylko aktualną wersję fiszki. To upraszcza schemat i zmniejsza złożoność.

### Q2: Czy przechowywać pełną historię odpowiedzi użytkownika dla każdej fiszki?
**A:** Nie, wystarczą aktualne parametry SM-2 (easiness_factor, interval, repetitions). Pełna historia nie jest potrzebna dla algorytmu ani metryk MVP.

### Q3: Jak szczegółowe powinny być statystyki generowania fiszek?
**A:** Statystyki na poziomie użytkownika - zagregowane dane o total_generated, total_accepted_direct, total_accepted_edited. To wystarczy dla metryki "75% akceptacji AI".

### Q4: Jak obsłużyć usuwanie kont użytkowników zgodnie z RODO?
**A:** Hard delete - całkowite usunięcie wszystkich danych użytkownika z bazy. Brak potrzeby soft delete lub archiwizacji dla MVP.

### Q5: Czy kolekcje i kategorie powinny być współdzielone między użytkownikami?
**A:** Nie, każdy użytkownik ma swoje prywatne kolekcje i kategorie. Dodajemy user_id do obu tabel.

### Q6: Gdzie przechowywać fiszki kandydaci (przed akceptacją przez użytkownika)?
**A:** Tylko w sesji (localStorage/sessionStorage). Nie zapisujemy ich w bazie przed akceptacją - to upraszcza schemat.

### Q7: Czy potrzebujemy partycjonowanie tabeli fiszek?
**A:** Nie dla MVP. Przy spodziewanej skali (tysiące fiszek na użytkownika) zwykłe indeksowanie wystarczy.

### Q8: Czy implementować auditowanie zmian w bazie danych?
**A:** Nie dla MVP. Zwiększałoby to złożoność bez wyraźnej wartości biznesowej na tym etapie.

### Q9: Co powinno się stać z fiszkami przy usunięciu kolekcji?
**A:** CASCADE DELETE - usunięcie kolekcji automatycznie usuwa wszystkie powiązane fiszki. To logiczne zachowanie dla użytkownika.

### Q10: Czy przechowywać historyczne dane dla metryk sukcesu?
**A:** Tak, ale tylko zagregowane w tabeli generation_stats. Potrzebujemy last_generation_at dla śledzenia aktywności.

### Q11: Jak szczegółowo logować sesje nauki?
**A:** Zagregowane dane w study_sessions (czas trwania, liczba fiszek, status). Bez szczegółowych logów każdej odpowiedzi.

### Q12: Kiedy aktualizować last_generation_at?
**A:** Przy każdym generowaniu fiszek (niezależnie od akceptacji). To pozwala śledzić aktywność użytkowników.

### Q13: Czy nazwy kolekcji powinny być globalne czy per użytkownik?
**A:** Unikalne per użytkownik. Różni użytkownicy mogą mieć kolekcje o takich samych nazwach.

### Q14: Jakie indeksy są potrzebne dla wydajności?
**A:** Przede wszystkim indeks na next_review_date dla szybkiego pobierania fiszek do powtórki.

### Q15: Jakie limity znaków dla nazw i treści?
**A:** Nazwy kolekcji/kategorii: 250 znaków, front fiszki: 200 znaków, back fiszki: 500 znaków.

### Q16: Czy logować sesje nauki dla metryk czasowych?
**A:** Tak, potrzebujemy study_sessions dla metryki "średni czas przeglądu <2min".

### Q17: Czy dodać pole difficulty/priority dla fiszek?
**A:** Nie dla MVP. Algorytm SM-2 sam zarządza priorytetami poprzez easiness_factor.

### Q18: Czy fiszka może należeć do wielu kategorii?
**A:** Nie, relacja one-to-many. Fiszka należy do jednej kategorii (lub żadnej).

### Q19: Jak mierzyć czas przeglądu fiszek?
**A:** Od wyświetlenia fiszki do zaznaczenia odpowiedzi przez użytkownika. Zapisujemy w study_sessions.

### Q20: Czy tworzyć nowe sesje nauki czy kontynuować istniejące?
**A:** Kontynuować istniejące sesje zamiast tworzyć nowe za każdym razem. Pozwala to na lepsze śledzenie.

### Q21: Jak liczyć procent fiszek z AI dla metryki "75% z AI"?
**A:** Tylko aktywne fiszki (nie usunięte). Bazujemy na polu created_by (manual vs ai_generated).

### Q22: Czy kategorie powinny mieć user_id?
**A:** Tak, kategorie są prywatne per użytkownik, podobnie jak kolekcje.

### Q23: Jaka powinna być domyślna wartość next_review_date?
**A:** Jutro (CURRENT_DATE + INTERVAL '1 day') dla nowo utworzonych fiszek.

### Q24: W jakiej strefie czasowej przechowywać daty?
**A:** UTC (TIMESTAMPTZ) dla wszystkich pól czasowych. Konwersja na lokalny czas w frontend.

### Q25: Jak modelować stany sesji nauki?
**A:** Enum SessionStatus z wartościami: active, completed, abandoned.

### Q26: Kiedy aktualizować ended_at w sesji?
**A:** Przy każdej fiszce, nie tylko na końcu sesji. To pozwala na śledzenie postępu.

### Q27: Jak obsłużyć timeout sesji?
**A:** Automatycznie zmieniać status na 'abandoned' po przekroczeniu timeout. Szczegóły implementacji do ustalenia.

### Q28: Jaki trigger dla next_review_date?
**A:** BEFORE INSERT z default value: (CURRENT_DATE + INTERVAL '1 day')::timestamptz

### Q29: Kiedy incrementować total_generated w statystykach?
**A:** Tylko przy successful generation (gdy AI faktycznie wygeneruje fiszki).

### Q30: Jak obsłużyć soft restart sesji?
**A:** Resetować flashcards_reviewed_count ale zachować sesję jako aktywną.

### Q31: Jakie indeksy dla unikalności?
**A:** Composite index na collections(user_id, name) i categories(user_id, name) dla unique constraints.

## Kluczowe Decyzje Architektoniczne

1. **Prostota MVP** - rezygnacja z zaawansowanych funkcji na rzecz szybkiego wdrożenia
2. **Bezpieczeństwo** - RLS policies dla pełnej izolacji danych użytkowników  
3. **Wydajność** - przemyślane indeksowanie zamiast przedwczesnej optymalizacji
4. **RODO compliance** - hard delete i prywatność danych użytkowników
5. **Metryki sukcesu** - minimalne ale wystarczające śledzenie dla KPI

## Nierozwiązane Kwestie

1. Mechanizm obsługi pustych kolekcji podczas sesji nauki
2. Dokładne wartości timeout dla sesji
3. Szczegóły implementacji algorytmu SM-2
4. Strategia backup i retention zgodna z RODO
5. Ograniczenia CHECK dla easiness_factor
6. Obsługa przeterminowanych dat przeglądu

---
*Sesja planistyczna przeprowadzona w celu określenia architektury bazy danych dla MVP aplikacji 10xDevFiszki* 