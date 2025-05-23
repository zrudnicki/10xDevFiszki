# Architektura UI dla aplikacji Fiszki

## 1. Przegląd architektury

Zgodnie z wymaganiami, aplikacja Fiszki będzie implementować architekturę opartą na osobnych ekranach, z naciskiem na prostotę, funkcjonalność i intuicyjność interfejsu. Aplikacja będzie wykorzystywać technologie Astro, React, TypeScript, Tailwind i komponenty Shadcn/ui, integrując się z backendem opartym na Supabase.

## 2. Główne ekrany aplikacji

### 2.1. Ekran logowania/rejestracji
- Prosty formularz uwierzytelniania (email/hasło)
- Przyciski "Zaloguj" i "Zarejestruj się"
- Implementacja poprzez komponenty Supabase Auth
- Walidacja pól formularza

### 2.2. Dashboard (Strona główna)
- Przegląd statystyk użytkownika w prostym formacie "8/10" (8 poprawnych z 10 wszystkich)
- Licznik utworzonych i przyswojonych fiszek
- Skróty do najczęściej używanych funkcji
- Przycisk przełączania trybu ciemny/jasny

### 2.3. Ekran generowania fiszek przez AI
- Trzyetapowy proces:
  1. **Wprowadzanie tekstu**:
     - Pole tekstowe z licznikiem znaków (1000-10000)
     - Przycisk "Generuj fiszki"
     - Walidacja długości tekstu
  
  2. **Recenzja kandydatów**:
     - Lista wygenerowanych fiszek (5-15)
     - Każda fiszka z przyciskami "Akceptuj" i "Edytuj"
     - Możliwość edycji pól Front (≤200 znaków) i Back (≤500 znaków)
  
  3. **Zapisywanie**:
     - Podsumowanie zaakceptowanych fiszek
     - Przypisanie do kolekcji i kategorii
     - Przycisk zapisu zbiorczego

### 2.4. Ekran "Moje fiszki"
- Lista fiszek użytkownika w formie tabeli/listy
- Filtrowanie wg kolekcji i kategorii
- Przyciski do edycji i usunięcia każdej fiszki
- Sortowanie wg daty utworzenia/edycji

### 2.5. Ekran nauki
- Widok pojedynczej fiszki z polami Front/Back
- Przyciski "Przyswojone" i "Wymaga powtórki"
- Minimalny wskaźnik postępu (np. "3/10 fiszek")
- Możliwość zakończenia sesji w dowolnym momencie

### 2.6. Ekrany zarządzania kolekcjami
- Lista kolekcji z możliwością tworzenia nowych
- Szczegóły kolekcji po kliknięciu
- Formularz edycji z polami nazwa i opis
- Potwierdzenie przed usunięciem kolekcji

### 2.7. Ekrany zarządzania kategoriami
- Lista kategorii z możliwością tworzenia nowych
- Szczegóły kategorii po kliknięciu
- Formularz edycji z polami nazwa i opis
- Potwierdzenie przed usunięciem kategorii

### 2.8. Ekran profilu użytkownika
- Podstawowe informacje o koncie
- Formularz zmiany hasła
- Przełącznik trybu jasny/ciemny
- Przycisk usunięcia konta z modalem potwierdzenia

## 3. Nawigacja

- **Górna belka nawigacyjna**:
  - Logo aplikacji (link do Dashboard)
  - Menu główne (Dashboard, Generowanie AI, Moje fiszki, Nauka)
  - Menu użytkownika (Profil, Wyloguj)

- **Menu mobilne**:
  - Menu typu hamburger na urządzeniach mobilnych
  - Po rozwinięciu pokazuje wszystkie opcje głównego menu

- **Nawigacja kontekstowa**:
  - Breadcrumbs na podstronach kolekcji i kategorii
  - Przyciski powrotu do poprzedniego widoku

## 4. Komponenty UI

### 4.1. Formularze
- Input, TextArea, Select, Checkbox, Button
- Walidacja danych zgodna z regułami API
- Komunikaty błędów pod polami formularza

### 4.2. Karty i listy
- Karty dla prezentacji fiszek
- Listy dla kolekcji i kategorii
- Komponenty rozwijane dla szczegółów

### 4.3. Komunikaty
- Toast dla potwierdzeń akcji (zapisanie fiszek, edycja)
- Modal dla potwierdzeń operacji usuwania
- Alert dla błędów API

### 4.4. Indykatory
- Minimalistyczny wskaźnik postępu nauki
- Spinner podczas operacji ładowania
- Badge dla statystyk "8/10"

## 5. Responsywność i dostępność

- Implementacja podejścia "mobile-first"
- Układ kolumnowy na urządzeniach mobilnych
- Układ siatkowy na tabletach i desktopach
- Dostępność zgodna ze standardami WCAG
- Prawidłowa struktura nagłówków i sekcji

## 6. Motywy

- Tryb jasny (domyślny)
- Tryb ciemny
- Przełącznik dostępny w profilu i panelu nawigacyjnym

## 7. Integracja z API

- Obsługa wszystkich endpointów zgodnie z dokumentacją API
- Zarządzanie tokenami autoryzacji
- Obsługa stanów ładowania i błędów dla każdej interakcji z API
- Walidacja danych zgodna z regułami API

## 8. Przepływy użytkownika

### 8.1. Generowanie fiszek przez AI
```
Wprowadzenie tekstu → Walidacja → Generowanie → Recenzja → Akceptacja/Edycja → Zapisanie
```

### 8.2. Nauka fiszek
```
Wybór kolekcji/kategorii → Przeglądanie fiszek pojedynczo → Oznaczanie jako przyswojona/wymaga powtórki → Podsumowanie
```

### 8.3. Zarządzanie fiszkami
```
Przeglądanie listy → Filtrowanie → Edycja/Usunięcie wybranej fiszki
```

### 8.4. Zarządzanie kontem
```
Logowanie → Edycja profilu/hasła → Wylogowanie
```