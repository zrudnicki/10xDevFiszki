# Architektura UI dla aplikacji Fiszki

## 1. Przegląd struktury UI

Aplikacja Fiszki będzie miała dwupoziomową strukturę nawigacji składającą się z:

1. **Górnego paska nawigacyjnego** - zawierającego główne funkcje aplikacji, takie jak przejście do dashboardu, generator fiszek, tryb nauki oraz menu użytkownika.
2. **Bocznego sidebara** - zapewniającego dostęp do kolekcji, kategorii i statystyk.

Główny interfejs będzie podzielony na następujące sekcje:
- Obszar uwierzytelniania (logowanie/rejestracja)
- Dashboard (ekran główny)
- Generator fiszek
- Widok recenzji wygenerowanych fiszek
- Tryb nauki/powtórki (pełnoekranowy)
- Zarządzanie kolekcjami i kategoriami
- Profil użytkownika i ustawienia
- Statystyki

Interfejs będzie korzystał z komponentów Shadcn/ui i stylowania za pomocą Tailwind CSS, co zapewni spójny wygląd i responsywność na różnych urządzeniach.

## 2. Lista widoków

### Widok logowania/rejestracji
- **Ścieżka**: `/auth`
- **Główny cel**: Umożliwienie użytkownikom uwierzytelnienia w systemie
- **Kluczowe informacje**:
  - Formularze logowania i rejestracji
  - Odnośnik do resetowania hasła
- **Kluczowe komponenty**:
  - Zakładki przełączające między logowaniem a rejestracją
  - Formularze z walidacją
  - Przyciski akcji (logowanie, rejestracja)
- **UX, dostępność i bezpieczeństwo**:
  - Jasne komunikaty błędów walidacji
  - Zabezpieczenie CSRF
  - Wykorzystanie mechanizmów uwierzytelniania Supabase

### Dashboard
- **Ścieżka**: `/` lub `/dashboard`
- **Główny cel**: Zapewnienie szybkiego dostępu do kluczowych funkcji i informacji
- **Kluczowe informacje**:
  - Ostatnio używane kolekcje
  - Statystyki generowania fiszek
  - Fiszki oczekujące na powtórkę
- **Kluczowe komponenty**:
  - Karty z ostatnio używanymi kolekcjami
  - Widżet statystyk generowania
  - Sekcja fiszek oczekujących na powtórkę z możliwością rozpoczęcia nauki
  - Przyciski szybkiego dostępu (generowanie, nauka)
- **UX, dostępność i bezpieczeństwo**:
  - Responsywny układ z kartami dostosowującymi się do szerokości ekranu
  - Czytelne etykiety i odpowiedni kontrast kolorów

### Generator fiszek
- **Ścieżka**: `/generator`
- **Główny cel**: Umożliwienie generowania fiszek z wprowadzonego tekstu
- **Kluczowe informacje**:
  - Pole tekstowe z licznikiem znaków
  - Instrukcje dotyczące długości tekstu
  - Wybór kolekcji i kategorii
- **Kluczowe komponenty**:
  - Textarea z licznikiem znaków (1000-10000)
  - Komunikat walidacyjny "Wprowadź tekst (min 1000, max 10000 znaków)"
  - Dropdowny do wyboru kolekcji i kategorii z możliwością filtrowania
  - Przycisk "Generuj" (dezaktywowany gdy tekst poza zakresem)
- **UX, dostępność i bezpieczeństwo**:
  - Wizualna walidacja długości tekstu
  - Blokowanie przycisku generowania w przypadku nieprawidłowej długości
  - Informacja o oczekiwaniu podczas generowania

### Widok recenzji wygenerowanych fiszek
- **Ścieżka**: `/review`
- **Główny cel**: Przegląd, edycja i akceptacja wygenerowanych fiszek
- **Kluczowe informacje**:
  - Lista wygenerowanych fiszek (front/back)
  - Opcje edycji
  - Status akceptacji
- **Kluczowe komponenty**:
  - Lista kart fiszek z podglądem front/back
  - Przyciski edycji dla każdej fiszki
  - Przyciski akceptacji/odrzucenia
  - Przycisk zbiorczego zapisu zaakceptowanych fiszek
- **UX, dostępność i bezpieczeństwo**:
  - Możliwość edycji treści w miejscu
  - Wyraźne oznaczenie statusu akceptacji
  - Potwierdzenie przed zapisem zbiorczym

### Tryb nauki/powtórki
- **Ścieżka**: `/learn` lub `/learn/:collectionId`
- **Główny cel**: Nauka i powtórki fiszek w trybie pełnoekranowym
- **Kluczowe informacje**:
  - Treść fiszki (front/back)
  - Informacja o postępie (np. "4/10")
  - Nazwa kolekcji
- **Kluczowe komponenty**:
  - Karta z animacją odwracania 3D
  - Przyciski "Przyswojone" i "Wymaga powtórki"
  - Wizualny pasek postępu z procentowym wskaźnikiem
  - Informacja o bieżącej fiszce i całkowitej liczbie
  - Przycisk wyjścia z trybu nauki
- **UX, dostępność i bezpieczeństwo**:
  - Płynna animacja odwracania karty
  - Minimalistyczny interfejs bez elementów rozpraszających
  - Możliwość nawigacji między fiszkami

### Widok kolekcji
- **Ścieżka**: `/collections`
- **Główny cel**: Zarządzanie kolekcjami fiszek
- **Kluczowe informacje**:
  - Lista kolekcji
  - Liczba fiszek w każdej kolekcji
  - Daty utworzenia/modyfikacji
- **Kluczowe komponenty**:
  - Lista kolekcji z liczbą fiszek
  - Przyciski do edycji/usuwania kolekcji
  - Formularz tworzenia nowej kolekcji
  - Pole wyszukiwania/filtrowania
- **UX, dostępność i bezpieczeństwo**:
  - Potwierdzenie przed usunięciem kolekcji
  - Sortowanie i filtrowanie listy
  - Czytelne etykiety i odpowiedni kontrast

### Widok szczegółów kolekcji
- **Ścieżka**: `/collections/:id`
- **Główny cel**: Przeglądanie i zarządzanie fiszkami w konkretnej kolekcji
- **Kluczowe informacje**:
  - Nazwa i opis kolekcji
  - Lista fiszek w kolekcji
  - Statystyki nauki
- **Kluczowe komponenty**:
  - Nagłówek z nazwą kolekcji i statystykami
  - Lista fiszek z możliwością podglądu front/back
  - Przyciski edycji/usuwania fiszek
  - Przycisk dodawania nowej fiszki
  - Przycisk rozpoczęcia nauki z tej kolekcji
- **UX, dostępność i bezpieczeństwo**:
  - Możliwość sortowania i filtrowania fiszek
  - Potwierdzenie przed usunięciem fiszki
  - Wskaźnik postępu nauki dla kolekcji

### Widok kategorii
- **Ścieżka**: `/categories`
- **Główny cel**: Zarządzanie kategoriami fiszek
- **Kluczowe informacje**:
  - Lista kategorii
  - Liczba fiszek w każdej kategorii
- **Kluczowe komponenty**:
  - Lista kategorii z liczbą fiszek
  - Przyciski do edycji/usuwania kategorii
  - Formularz tworzenia nowej kategorii
  - Pole wyszukiwania/filtrowania
- **UX, dostępność i bezpieczeństwo**:
  - Potwierdzenie przed usunięciem kategorii
  - Czytelne etykiety i odpowiedni kontrast

### Widok tworzenia/edycji fiszki
- **Ścieżka**: `/flashcards/new` lub `/flashcards/:id/edit`
- **Główny cel**: Ręczne tworzenie lub edycja pojedynczej fiszki
- **Kluczowe informacje**:
  - Pola front i back
  - Wybór kolekcji i kategorii
- **Kluczowe komponenty**:
  - Formularz z polami Front (do 200 znaków) i Back (do 500 znaków)
  - Dropdowny do wyboru kolekcji i kategorii
  - Liczniki znaków dla pól
  - Przyciski zapisz/anuluj
- **UX, dostępność i bezpieczeństwo**:
  - Walidacja długości pól w czasie rzeczywistym
  - Blokowanie przycisku zapisu dla nieprawidłowych danych
  - Opcja podglądu karty przed zapisaniem

### Widok profilu/ustawień
- **Ścieżka**: `/profile` lub `/settings`
- **Główny cel**: Zarządzanie profilem użytkownika i ustawieniami
- **Kluczowe informacje**:
  - Dane profilu
  - Opcje ustawień
  - Zarządzanie kontem
- **Kluczowe komponenty**:
  - Formularz z danymi profilu
  - Formularz zmiany hasła
  - Sekcja usuwania konta
  - Ustawienia aplikacji
- **UX, dostępność i bezpieczeństwo**:
  - Dwustopniowe potwierdzenie przy usuwaniu konta
  - Walidacja formularzy
  - Jasne komunikaty o sukcesie/błędzie

### Widok statystyk
- **Ścieżka**: `/stats`
- **Główny cel**: Prezentacja statystyk generowania i nauki
- **Kluczowe informacje**:
  - Liczba wygenerowanych fiszek
  - Liczba zaakceptowanych fiszek
  - Procent zaakceptowanych
  - Statystyki nauki (nauczone vs do powtórki)
- **Kluczowe komponenty**:
  - Karty z kluczowymi wskaźnikami
  - Wykresy pokazujące trendy
  - Filtrowanie po okresach czasu
- **UX, dostępność i bezpieczeństwo**:
  - Czytelne wizualizacje danych
  - Alternatywne przedstawienie danych dla osób z niepełnosprawnościami
  - Wyraźnie oznaczone osie i legendy wykresów

## 3. Mapa podróży użytkownika

### Główny przepływ użytkownika

1. **Rejestracja i pierwsze logowanie**
   - Użytkownik rejestruje się → loguje się → trafia na Dashboard
   - Dashboard zawiera wprowadzenie dla nowych użytkowników

2. **Generowanie fiszek**
   - Dashboard → Kliknięcie "Generuj fiszki" → Widok generatora
   - Wprowadzenie tekstu, wybór kolekcji/kategorii → Kliknięcie "Generuj"
   - Oczekiwanie na generowanie → Widok recenzji wygenerowanych fiszek
   - Przegląd, edycja fiszek → Akceptacja wybranych → Zapisanie

3. **Nauka i powtórki**
   - Dashboard → Kliknięcie "Rozpocznij naukę" lub wybór konkretnej kolekcji
   - Tryb nauki/powtórki → Przeglądanie fiszek, oznaczanie jako przyswojone/do powtórki
   - Zakończenie sesji → Powrót do Dashboard z podsumowaniem

4. **Zarządzanie kolekcjami**
   - Dashboard → Sidebar "Kolekcje" → Widok kolekcji
   - Przeglądanie/tworzenie/edycja/usuwanie kolekcji
   - Kliknięcie na kolekcję → Widok szczegółów kolekcji
   - Zarządzanie fiszkami w kolekcji

5. **Ręczne tworzenie fiszek**
   - Widok szczegółów kolekcji → Kliknięcie "Dodaj fiszkę" → Formularz nowej fiszki
   - Wypełnienie pól → Zapisanie → Powrót do widoku kolekcji

6. **Przeglądanie statystyk**
   - Dashboard → Sidebar "Statystyki" → Widok statystyk
   - Przeglądanie różnych wskaźników i wykresów

### Przypadki szczególne

1. **Użytkownik bez kolekcji**
   - Po pierwszym logowaniu → Dashboard z zachętą do utworzenia kolekcji
   - Kliknięcie "Utwórz pierwszą kolekcję" → Formularz nowej kolekcji

2. **Błąd generowania fiszek**
   - Widok generatora → Kliknięcie "Generuj" → Błąd API
   - Wyświetlenie komunikatu błędu → Opcja ponownej próby

3. **Usuwanie konta**
   - Widok profilu → Kliknięcie "Usuń konto" → Modal potwierdzenia
   - Potwierdzenie → Druga weryfikacja → Wylogowanie i usunięcie danych

## 4. Układ i struktura nawigacji

### Górny pasek nawigacyjny
- **Lewa strona**:
  - Logo/Nazwa aplikacji (link do Dashboard)
- **Środek**:
  - Przycisk "Generuj fiszki" (link do generatora)
  - Przycisk "Rozpocznij naukę" (link do wyboru kolekcji do nauki)
- **Prawa strona**:
  - Menu użytkownika (avatar/imię)
    - Profil/Ustawienia
    - Wylogowanie

### Boczny sidebar
- Dashboard (Home)
- Kolekcje
- Kategorie
- Statystyki
- Fiszki oczekujące na powtórkę (z licznikiem)

### Nawigacja kontekstowa
- **W widoku kolekcji**:
  - Breadcrumbs (Dashboard > Kolekcje)
  - Przyciski Dodaj/Sortuj/Filtruj
- **W widoku szczegółów kolekcji**:
  - Breadcrumbs (Dashboard > Kolekcje > Nazwa kolekcji)
  - Przyciski Dodaj fiszkę/Edytuj kolekcję/Rozpocznij naukę
- **W trybie nauki**:
  - Przycisk wyjścia
  - Przyciski nawigacji między fiszkami

### Responsywność
- Na urządzeniach mobilnych sidebar chowa się i jest dostępny przez przycisk menu
- Górny pasek upraszcza się na małych ekranach
- Karty i listy układają się wertykalnie na wąskich ekranach

## 5. Kluczowe komponenty

### Card
- Wykorzystanie: Fiszki, kolekcje, widżety na dashboardzie
- Opis: Komponent Shadcn/ui z możliwością dodania tytułu, zawartości i akcji
- Warianty: Standardowy, interaktywny (z animacją)

### Button
- Wykorzystanie: Akcje w całej aplikacji
- Opis: Komponent Shadcn/ui z różnymi wariantami i stanami
- Warianty: Primary, Secondary, Outline, Destructive, Disabled

### Textarea
- Wykorzystanie: Generator fiszek, edycja fiszek
- Opis: Pole tekstowe z licznikiem znaków i walidacją
- Dodatkowe funkcje: Automatyczna zmiana rozmiaru, podświetlanie błędów

### Select/Dropdown
- Wykorzystanie: Wybór kolekcji/kategorii
- Opis: Komponent Shadcn/ui z możliwością wyszukiwania i filtrowania
- Dodatkowe funkcje: Filtrowanie w czasie wpisywania

### Progress
- Wykorzystanie: Pasek postępu w trybie nauki
- Opis: Wizualny wskaźnik postępu z wartością procentową
- Warianty: Standard, Success (zielony), Warning (żółty)

### Toast
- Wykorzystanie: Powiadomienia o sukcesie/błędzie
- Opis: Komunikaty pojawiające się w prawym górnym rogu
- Warianty: Success, Error, Warning, Info

### FlashCard
- Wykorzystanie: Reprezentacja fiszki w trybie nauki
- Opis: Niestandardowy komponent z animacją odwracania 3D
- Funkcje: Pokazywanie front/back, animacja odwracania

### Modal
- Wykorzystanie: Potwierdzenia, formularze
- Opis: Komponent Shadcn/ui do wyświetlania zawartości na pierwszym planie
- Warianty: Standardowy, z formularzem, potwierdzenie

### Form
- Wykorzystanie: Logowanie, rejestracja, tworzenie/edycja zasobów
- Opis: Zestaw komponentów Shadcn/ui do budowy formularzy z walidacją
- Funkcje: Walidacja w czasie rzeczywistym, obsługa błędów, stany loading

### ProgressRing
- Wykorzystanie: Statystyki, wskaźniki procentowe
- Opis: Okrągły wskaźnik postępu z wartością wewnątrz
- Warianty: Różne rozmiary i kolory
