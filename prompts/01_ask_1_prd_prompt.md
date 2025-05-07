Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>
### Główny problem
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca do korzystania z efektywnej metody nauki jaką jest spaced repetition.

### Najmniejszy zestaw funkcjonalności
- Generowanie fiszek przez AI na podstawie wprowadzonego tekstu (kopiuj-wklej)
- Manualne tworzenie fiszek
- Przeglądanie, edycja i usuwanie fiszek
- Prosty system kont użytkowników do przechowywania fiszek
- Integracja fiszek z gotowym algorytmem powtórek

### Co NIE wchodzi w zakres MVP
- Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
- Import wielu formatów (PDF, DOCX, itp.)
- Współdzielenie zestawów fiszek między użytkownikami
- Integracje z innymi platformami edukacyjnymi
- Aplikacje mobilne (na początek tylko web)

### Kryteria sukcesu
- 75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika
- Użytkownicy tworzą 75% fiszek z wykorzystaniem AI
</project_description>

<project_details>
<conversation_summary>
<decisions>
0. Program ma rozwiązać następujący problem: Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca do korzystania z efektywnej metody nauki jaką jest spaced repetition.
1. Projekt koncentruje się na uproszczonym MVP umożliwiającym generowanie fiszek przez AI oraz ręczne tworzenie i edycję fiszek z dwoma polami: przód (do 200 znaków) i tył (do 500 znaków).
2. Proces recenzji fiszek generowanych przez AI ma przebiegać synchronicznie – użytkownik przegląda kandydatów, a następnie za pomocą przycisków "zaakceptuj", "edytuj" lub "odrzuć" bulk zapisuje swoje decyzje, co powoduje zapis zaakceptowanych fiszek do bazy danych.
3. Walidacja danych będzie przeprowadzana na trzech poziomach: frontend, backend oraz baza danych, a tekst wejściowy do generowania fiszek musi mieścić się w zakresie od 1000 do 10 000 znaków.
4. W MVP nie przewiduje się rozbudowanej edycji fiszek – użytkownik może jedynie edytować istniejące pole "przód" i "tył", bez możliwości dodawania nowych pól.
5. System kont użytkowników pozostaje prosty, ze szczególnym uwzględnieniem mechanizmu usuwania kont, a integracja z algorytmem powtórek oparta jest na bibliotece open-source.
</decisions>

<matched_recommendations>
1. Dokładne zmapowanie user journey – od wprowadzenia tekstu wejściowego, przez generowanie kandydatów, aż po recenzję i zapisanie zaakceptowanych fiszek.
2. Implementacja automatycznej walidacji danych na poziomie frontendu, backendu i bazy danych, z uwzględnieniem ograniczeń znaków dla pól fiszek oraz tekstu wejściowego.
3. Prototypowanie interfejsu użytkownika, który łączy generowanie fiszek przez AI i ręczne tworzenie/edycję, zachowując spójność i prostotę korzystania.
4. Przygotowanie dokumentacji integracji z biblioteką gotoeym i ustalenie parametrów technicznych tej integracji.
5. Zapewnienie odpowiednich mechanizmów bezpieczeństwa oraz testów end-to-end dla wszystkich krytycznych komponentów MVP.
</matched_recommendations>

<prd_planning_summary>
Produkt ma na celu rozwiązanie problemów związanych z ręcznym tworzeniem fiszek edukacyjnych poprzez umożliwienie generowania ich przez AI oraz udostępnienie prostego interfejsu do ręcznego tworzenia i edycji fiszek. Główne wymagania funkcjonalne obejmują:
• Generowanie fiszek przez AI na podstawie tekstu wejściowego (o długości 1000–10 000 znaków), który jest przetwarzany na kilka do kilkunastu fiszek.
• Ręczne tworzenie fiszek za pomocą formularza, ograniczonego do dwóch pól: przód (do 200 znaków) oraz tył (do 500 znaków).
• Proces recenzji, w którym użytkownik przegląda kandydatów wygenerowanych przez AI i podejmuje decyzje za pomocą przycisków “zaakceptuj”, “edytuj” lub “odrzuć”; zaakceptowane fiszki trafiają do bazy danych przy zapisie zbiorczym.
• Prosty system kont użytkowników z funkcjonalnością edycji i usuwania (z możliwością potwierdzenia przy usuwaniu).
• Integrację z algorytmem powtórek opartym na bibliotece opens-ource.
Kluczowe historie użytkownika obejmują:
• Użytkownika wprowadzającego tekst do generowania fiszek i oczekującego wstępnej weryfikacji oraz prezentacji wyników.
• Użytkownika korzystającego z interfejsu do ręcznego tworzenia i edycji fiszek.
• Użytkownika przeglądającego wygenerowane kandydatury na fiszki, który może je zaakceptować, edytować lub odrzucić oraz zapisać zmiany w systemie.
Kryteria sukcesu obejmują m.in. akceptację przez użytkowników przynajmniej 75% fiszek generowanych przez AI oraz zapewnienie intuicyjności oraz szybkości działania systemu, co będzie mierzone m.in. przez feedback użytkowników i analizy wydajności.
</prd_planning_summary>

<unresolved_issues>
1. Szczegóły dotyczące mechanizmu potwierdzenia usuwania kont oraz ewentualnej archiwizacji danych przed usunięciem pozostają do doprecyzowania.
2. Dalsze ustalenia dotyczące potencjalnych wymagań w zakresie bezpieczeństwa danych przechowywanych w formacie tekstowym.
</unresolved_issues>
</conversation_summary>
</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:
- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( ** ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}
## 1. Przegląd produktu
## 2. Problem użytkownika
## 3. Wymagania funkcjonalne
## 4. Granice produktu
## 5. Historyjki użytkowników
## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md