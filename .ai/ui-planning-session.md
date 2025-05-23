# Podsumowanie planowania architektury UI

## Decyzje projektowe

1. Interfejs powinien zawierać szybki dostęp do ostatnio używanych kolekcji, statystyk generowania i fiszek oczekujących na powtórkę.
2. UI powinien mieć strukturę z bocznym sidebarem i górną nawigacją.
3. Fiszki w trybie nauki/powtórki będą prezentowane jako karty z możliwością obracania i animacją.
4. Tryb nauki/powtórki powinien być pełnoekranowy.
5. Użytkownik będzie miał pełną możliwość edycji fiszek wygenerowanych przez AI.
6. Walidacja wprowadzanego tekstu powinna blokować przycisk "Generuj" gdy liczba znaków jest mniejsza niż 1000 lub większa niż 10000.
7. W widoku nauki/powtórki powinien być wyświetlany numer aktualnej fiszki oraz całkowita liczba fiszek (np. 4/10) oraz nazwa kolekcji.
8. Pasek postępu nauki powinien być wizualny z dodatkowymi informacjami procentowymi.
9. Kolekcje i kategorie powinny być wybierane z dropdownu z możliwością zawężania opcji podczas wpisywania.
10. Generator fiszek powinien być zaimplementowany jako oddzielna podstrona.
11. Najważniejsze statystyki to liczba poprawnie odpowiedzianych fiszek z danej kategorii w stosunku do wszystkich.
12. Komunikaty o błędach powinny być szczegółowe.
13. Rezygnacja z implementacji skrótów klawiszowych w MVP.
14. Powiadomienia o błędach i akcjach powinny być wyświetlane jako toast messages w prawym górnym rogu.

## Rekomendacje

1. Zaimplementować layout z bocznym sidebarem zawierającym dostęp do kolekcji fiszek i górnym paskiem nawigacyjnym do głównych funkcji aplikacji.
2. Zaprojektować generator fiszek z textareą, licznikiem znaków, komunikatem walidacyjnym i przyciskiem "Generuj" dezaktywowanym poza zakresem 1000-10000 znaków.
3. Stworzyć minimalistyczny widok pełnoekranowy nauki/powtórki z kartą z animacją odwracania 3D, informacją o numerze aktualnej fiszki i nazwie kolekcji oraz wizualnym paskiem postępu z procentowym wskaźnikiem.
4. Zaprojektować dashboard z sekcjami: ostatnio używane kolekcje, statystyki generowania fiszek oraz fiszki oczekujące na powtórkę.
5. Zaimplementować widok recenzji wygenerowanych fiszek umożliwiający podgląd, edycję i akceptację każdej fiszki.
6. Utworzyć system powiadomień (toast messages) w prawym górnym rogu dla komunikatów o walidacji, sukcesie lub błędach.
7. Wykorzystać komponenty Shadcn/ui i Tailwind dla spójności wizualnej i responsywności interfejsu.
8. Zaprojektować dropdown do wyboru kolekcji i kategorii z funkcją filtrowania podczas pisania.
9. Zapewnić prosty i intuicyjny przepływ pracy użytkownika z minimalną liczbą kroków między generowaniem a nauką.
10. Implementować szczegółowe i czytelne komunikaty błędów zgodne z wymaganiami API i bazy danych.

## Architektura UI

Projekt 10xDevFiszki to aplikacja do generowania i zarządzania fiszkami edukacyjnymi z wykorzystaniem AI. Na podstawie przeprowadzonej rozmowy, ustalono kluczowe elementy architektury UI dla MVP aplikacji.

### Główne wymagania dotyczące architektury UI

Architektura UI powinna być oparta na nowoczesnym stacku technologicznym obejmującym Astro 5, React 19, TypeScript 5, Tailwind 4 oraz komponenty Shadcn/ui. Ważnym aspektem jest prostota i intuicyjność interfejsu, z naciskiem na minimalistyczny design i płynne przejścia między widokami.

### Kluczowe widoki, ekrany i przepływy użytkownika

#### Dashboard - główny ekran zawierający:

- Sekcję z ostatnio używanymi kolekcjami
- Statystyki generowania fiszek (liczba wygenerowanych i zaakceptowanych)
- Fiszki oczekujące na powtórkę z możliwością szybkiego rozpoczęcia nauki

#### Generator fiszek (oddzielna podstrona) zawierający:

- Textarea do wprowadzania tekstu z licznikiem znaków (1000-10000)
- Komunikat walidacyjny "Wprowadź tekst (min 1000, max 10000 znaków)"
- Przycisk "Generuj" (dezaktywowany poza zakresem znaków)
- Dropdown do wyboru kolekcji i kategorii z funkcją filtrowania

#### Widok recenzji wygenerowanych fiszek:

- Lista wygenerowanych fiszek (front/back)
- Możliwość edycji każdej fiszki
- Przyciski "Akceptuj" i "Edytuj" dla każdej fiszki
- Opcja zbiorczego zapisu zaakceptowanych fiszek

#### Tryb nauki/powtórki (pełnoekranowy):

- Karta z animacją odwracania 3D
- Informacja o numerze aktualnej fiszki (np. "4/10") i nazwie kolekcji
- Wizualny pasek postępu z procentowym wskaźnikiem ukończenia
- Przyciski "Przyswojone" i "Wymaga powtórki"

#### Zarządzanie kolekcjami i kategoriami:

- Lista kolekcji z liczbą fiszek
- Możliwość edycji, usuwania i dodawania nowych kolekcji/kategorii

Główny przepływ użytkownika powinien być maksymalnie uproszczony: **Dashboard → Generator fiszek → Recenzja → Zapis → Dashboard → Nauka/Powtórka**, z minimalną liczbą kroków między generowaniem a nauką.

### Strategia integracji z API i zarządzania stanem

#### Integracja z API:

- Wykorzystanie endpointów API określonych w planie API, szczególnie do:
  - Generowania fiszek przez AI (`/api/ai/generate-flashcards`)
  - Akceptacji wygenerowanych fiszek (`/api/ai/flashcards/accept`)
  - Zarządzania kolekcjami i kategoriami
  - Oznaczania fiszek jako przyswojone lub wymagające powtórki

#### Zarządzanie stanem:

- Wykorzystanie Context API z React dla efektywnej synchronizacji z Supabase API
- Przechowywanie tymczasowych danych generowanych fiszek przed ich zaakceptowaniem
- Zarządzanie stanem walidacji formularzy i komunikatów

### Responsywność, dostępność i bezpieczeństwo

#### Responsywność:

- Wykorzystanie Tailwind oraz komponentów Shadcn/ui dla zapewnienia responsywności
- Zastosowanie podejścia mobile-first

#### Dostępność:

- Zapewnienie odpowiedniego kontrastu dla czytelności tekstu
- Przejrzyste komunikaty błędów i walidacji

#### Bezpieczeństwo:

- Wykorzystanie mechanizmów uwierzytelniania Supabase
- Walidacja danych zgodna z ograniczeniami bazy danych

### Komponenty UI i wzorce interakcji

#### Komponenty:

- Card i CardContent (Shadcn/ui) dla fiszek
- Button dla akcji
- Textarea z licznikiem znaków dla wprowadzania tekstu
- Select/Dropdown dla wyboru kolekcji i kategorii
- Progress dla wizualnego paska postępu z procentami
- Toast dla powiadomień i komunikatów

#### Wzorce interakcji:

- Animacja odwracania karty jako podstawowy element interakcji w trybie nauki
- Filtrowanie dropdown podczas wpisywania dla szybkiego znajdowania opcji
- System powiadomień (toast messages) w prawym górnym rogu
- Wizualna walidacja pól tekstowych (kolorystyczne oznaczenie prawidłowej/nieprawidłowej długości)

## Nierozwiązane kwestie

1. Brak szczegółów dotyczących implementacji systemu ciemnego/jasnego motywu.
2. Nie określono dokładnego wyglądu i mechaniki animacji odwracania kart fiszek.
3. Nie sprecyzowano szczegółowego układu sidebara i górnej nawigacji (które elementy mają być umieszczone konkretnie gdzie).
4. Brak decyzji dotyczącej mechanizmów wsparcia dla użytkowników (np. przewodnik, wskazówki, tooltips).
5. Nie omówiono szczegółowego podejścia do obsługi błędów API i ich prezentacji w interfejsie.
