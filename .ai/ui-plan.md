# Architektura UI dla Fiszki

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji Fiszki opiera się na modelu wielostronicowym z wyraźnym podziałem na obszary funkcjonalne. Główne obszary to: uwierzytelnianie, pulpit użytkownika, generowanie fiszek przez AI, zarządzanie kolekcjami i kategoriami, proces nauki (spaced repetition) oraz panel ustawień. Aplikacja korzysta z nowoczesnego, responsywnego designu, zapewniającego dostępność na różnych urządzeniach.

Struktura opiera się na następujących założeniach:
- Jednolity layout z spójną nawigacją główną
- Intuicyjny przepływ użytkownika przez kluczowe funkcje
- Wyraźne rozdzielenie logiki biznesowej od prezentacji
- Wsparcie dla walidacji danych na poziomie interfejsu
- Obsługa stanów błędów i ładowania danych

## 2. Lista widoków

### Widoki uwierzytelniania

#### Strona Logowania
- **Ścieżka widoku**: `/login`
- **Główny cel**: Umożliwienie użytkownikowi zalogowania się do aplikacji
- **Kluczowe informacje**: Formularz logowania, linki do rejestracji i resetowania hasła
- **Kluczowe komponenty**: 
  - LoginForm (formularz logowania)
  - FormErrorDisplay (wyświetlanie błędów walidacji)
  - SocialLoginOptions (opcje logowania przez media społecznościowe)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Walidacja pól w czasie rzeczywistym
  - Wyraźne komunikaty błędów
  - Zabezpieczenie przed atakami brute force
  - Pełna dostępność WCAG 2.1

#### Strona Rejestracji
- **Ścieżka widoku**: `/register`
- **Główny cel**: Umożliwienie nowym użytkownikom założenia konta
- **Kluczowe informacje**: Formularz rejestracji, regulamin, polityka prywatności
- **Kluczowe komponenty**: 
  - RegisterForm (formularz rejestracji)
  - FormErrorDisplay (wyświetlanie błędów walidacji)
  - PrivacyTermsConsent (zgoda na warunki korzystania z serwisu)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Walidacja złożoności hasła
  - Potwierdzenie adresu e-mail
  - Zabezpieczenia reCAPTCHA lub podobne
  - Informacje o przetwarzaniu danych osobowych (RODO)

#### Strona Resetowania Hasła
- **Ścieżka widoku**: `/reset-password`
- **Główny cel**: Umożliwienie użytkownikowi zresetowania zapomnianego hasła
- **Kluczowe informacje**: Formularz z polem na adres e-mail, instrukcje resetowania
- **Kluczowe komponenty**: 
  - ResetPasswordForm (formularz resetowania hasła)
  - ConfirmationMessage (potwierdzenie wysłania linku resetującego)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Nieujawnianie informacji o istnieniu konta
  - Limitowanie liczby prób resetowania
  - Link resetujący z ograniczonym czasem ważności

### Widoki główne

#### Strona Główna (po zalogowaniu)
- **Ścieżka widoku**: `/dashboard`
- **Główny cel**: Prezentacja stanu nauki i szybki dostęp do głównych funkcji
- **Kluczowe informacje**: Statystyki użytkownika, fiszki do powtórki, najnowsze kolekcje
- **Kluczowe komponenty**: 
  - DashboardStats (statystyki użytkownika)
  - DueFlashcardsPreview (lista fiszek oczekujących na powtórkę)
  - RecentCollections (ostatnio używane kolekcje)
  - QuickActions (skróty do głównych funkcji)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Personalizacja widoku na podstawie historii użytkownika
  - Wyraźne komunikaty o stanie nauki
  - Intuicyjne skróty do najczęściej używanych funkcji

#### Profil Użytkownika
- **Ścieżka widoku**: `/profile`
- **Główny cel**: Zarządzanie danymi profilu i preferencjami użytkownika
- **Kluczowe informacje**: Dane użytkownika, opcje preferencji, statystyki ogólne
- **Kluczowe komponenty**: 
  - ProfileForm (formularz edycji profilu)
  - AccountSettings (ustawienia konta)
  - DeleteAccountButton (przycisk usunięcia konta z potwierdzeniem)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Dwustopniowe potwierdzenie usunięcia konta
  - Jasna informacja o konsekwencjach usunięcia danych
  - Możliwość eksportu własnych danych

### Widoki generowania fiszek

#### Strona Wprowadzania Tekstu
- **Ścieżka widoku**: `/generator/input`
- **Główny cel**: Wprowadzenie tekstu źródłowego do generowania fiszek przez AI
- **Kluczowe informacje**: Formularz tekstowy, licznik znaków, opcje generowania
- **Kluczowe komponenty**: 
  - GeneratorLayout (layout z paskiem postępu)
  - TextInputForm (formularz wprowadzania tekstu)
  - TextareaWithCounter (pole tekstowe z licznikiem znaków)
  - GeneratorOptionsForm (opcje generowania)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Walidacja długości tekstu (1000-10000 znaków)
  - Automatyczny zapis wersji roboczej
  - Wskaźnik złożoności tekstu
  - Podpowiedzi dotyczące optymalnej długości

#### Strona Recenzji Fiszek
- **Ścieżka widoku**: `/generator/review`
- **Główny cel**: Przegląd i akceptacja wygenerowanych fiszek
- **Kluczowe informacje**: Lista wygenerowanych fiszek, przyciski akcji (akceptuj/odrzuć/edytuj)
- **Kluczowe komponenty**: 
  - GeneratorLayout (layout z paskiem postępu)
  - FlashcardReviewList (lista wygenerowanych fiszek)
  - FlashcardReviewItem (pojedyncza fiszka do recenzji)
  - FlashcardActionButtons (przyciski akcji dla fiszki)
  - FlashcardEditModal (modal do edycji fiszki)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Intuicyjne oznaczenia fiszek (zaakceptowane/odrzucone)
  - Walidacja limitów znaków przy edycji
  - Możliwość odwracania kart dla lepszego przeglądu
  - Wizualne potwierdzenia akcji użytkownika

#### Strona Zapisywania Fiszek
- **Ścieżka widoku**: `/generator/save`
- **Główny cel**: Finalizacja procesu generowania i zapisanie zaakceptowanych fiszek
- **Kluczowe informacje**: Lista zaakceptowanych fiszek, wybór kolekcji/kategorii, przycisk zapisu
- **Kluczowe komponenty**: 
  - GeneratorLayout (layout z paskiem postępu)
  - AcceptedFlashcardsList (lista zaakceptowanych fiszek)
  - CollectionAssignmentForm (formularz przypisania do kolekcji)
  - SaveButton (przycisk zapisania fiszek)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Podsumowanie procesu generowania
  - Możliwość zmiany przypisania kolekcji/kategorii dla wszystkich fiszek
  - Informacja o liczbie zaakceptowanych/odrzuconych fiszek
  - Potwierdzenie pomyślnego zapisu

### Widoki zarządzania fiszkami

#### Lista Kolekcji
- **Ścieżka widoku**: `/collections`
- **Główny cel**: Przeglądanie i zarządzanie kolekcjami fiszek
- **Kluczowe informacje**: Lista kolekcji, liczba fiszek w każdej kolekcji, daty utworzenia/aktualizacji
- **Kluczowe komponenty**: 
  - CollectionsList (lista kolekcji)
  - CollectionCard (karta pojedynczej kolekcji)
  - CreateCollectionButton (przycisk tworzenia nowej kolekcji)
  - SearchFilter (filtrowanie kolekcji)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Sortowanie i filtrowanie kolekcji
  - Podgląd podstawowych informacji o kolekcji
  - Intuicyjne akcje zarządzania (edycja, usuwanie)

#### Szczegóły Kolekcji
- **Ścieżka widoku**: `/collections/:id`
- **Główny cel**: Przeglądanie i zarządzanie fiszkami w konkretnej kolekcji
- **Kluczowe informacje**: Dane kolekcji, lista fiszek, statystyki kolekcji
- **Kluczowe komponenty**: 
  - CollectionDetails (szczegóły kolekcji)
  - FlashcardList (lista fiszek w kolekcji)
  - CollectionActions (przyciski akcji dla kolekcji)
  - AddFlashcardButton (przycisk dodawania nowej fiszki)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Grupowanie fiszek według kategorii
  - Możliwość masowej edycji fiszek
  - Statystyki postępu nauki dla kolekcji

#### Lista Kategorii
- **Ścieżka widoku**: `/categories`
- **Główny cel**: Przeglądanie i zarządzanie kategoriami fiszek
- **Kluczowe informacje**: Lista kategorii, liczba fiszek w każdej kategorii
- **Kluczowe komponenty**: 
  - CategoriesList (lista kategorii)
  - CategoryCard (karta pojedynczej kategorii)
  - CreateCategoryButton (przycisk tworzenia nowej kategorii)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Możliwość szybkiego filtrowania kategorii
  - Wizualna reprezentacja wielkości kategorii
  - Proste zarządzanie (dodawanie, edycja, usuwanie)

#### Szczegóły Kategorii
- **Ścieżka widoku**: `/categories/:id`
- **Główny cel**: Przeglądanie i zarządzanie fiszkami w konkretnej kategorii
- **Kluczowe informacje**: Dane kategorii, lista fiszek, statystyki kategorii
- **Kluczowe komponenty**: 
  - CategoryDetails (szczegóły kategorii)
  - FlashcardList (lista fiszek w kategorii)
  - CategoryActions (przyciski akcji dla kategorii)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Podgląd fiszek z różnych kolekcji w ramach jednej kategorii
  - Możliwość zmiany kategorii dla wielu fiszek naraz
  - Statystyki efektywności nauki dla kategorii

#### Edycja Fiszki
- **Ścieżka widoku**: `/flashcards/:id/edit`
- **Główny cel**: Edycja zawartości istniejącej fiszki
- **Kluczowe informacje**: Formularz edycji front/back, przypisanie do kolekcji/kategorii
- **Kluczowe komponenty**: 
  - FlashcardEditForm (formularz edycji fiszki)
  - CharacterCounter (licznik znaków dla pól)
  - CollectionCategorySelector (wybór kolekcji/kategorii)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Walidacja limitów znaków (front ≤ 200, back ≤ 500)
  - Podgląd fiszki w trakcie edycji
  - Automatyczne zapisywanie szkicu zmian

### Widoki nauki

#### Sesja Nauki
- **Ścieżka widoku**: `/study`
- **Główny cel**: Przeglądanie fiszek do nauki zgodnie z algorytmem spaced repetition
- **Kluczowe informacje**: Aktualna fiszka, przyciski oznaczania statusu przyswojenia
- **Kluczowe komponenty**: 
  - StudySession (kontener sesji nauki)
  - FlashcardDisplay (wyświetlanie aktualnej fiszki)
  - FlashcardControls (przyciski kontroli nauki)
  - SessionProgress (pasek postępu sesji)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Intuicyjne odwracanie karty (front/back)
  - Klawisze skrótu dla szybkiej interakcji
  - Wskaźnik postępu sesji nauki
  - Możliwość pauzy i kontynuacji sesji

#### Statystyki Nauki
- **Ścieżka widoku**: `/stats`
- **Główny cel**: Prezentacja postępów nauki i statystyk generowania fiszek
- **Kluczowe informacje**: Wykresy postępu, statystyki efektywności, trendy nauki
- **Kluczowe komponenty**: 
  - LearningStats (statystyki nauki)
  - GenerationStats (statystyki generowania fiszek przez AI)
  - ProgressCharts (wykresy postępu)
  - EfficiencyMetrics (metryki efektywności)
- **UX, dostępność i względy bezpieczeństwa**: 
  - Dostosowane wykresy dla różnych metryk
  - Możliwość filtrowania danych według okresu
  - Eksport statystyk do CSV/PDF

## 3. Mapa podróży użytkownika

### Główny przepływ użytkownika

1. **Rejestracja i logowanie**
   - Użytkownik odwiedza stronę główną
   - Wybiera opcję rejestracji
   - Wypełnia formularz rejestracyjny
   - Potwierdza adres email (opcjonalnie)
   - Loguje się do aplikacji

2. **Pierwsza wizyta po zalogowaniu**
   - Użytkownik trafia na dashboard
   - Otrzymuje krótki samouczek prezentujący główne funkcje
   - Zachęcany jest do utworzenia pierwszej kolekcji lub wygenerowania fiszek

3. **Generowanie fiszek przez AI**
   - Użytkownik wybiera opcję generowania fiszek
   - Wprowadza tekst źródłowy (1000-10000 znaków)
   - Wybiera kolekcję/kategorię lub tworzy nowe
   - Inicjuje proces generowania
   - Otrzymuje listę wygenerowanych fiszek do recenzji
   - Oznacza fiszki jako zaakceptowane, odrzucone lub do edycji
   - Zapisuje zaakceptowane fiszki do kolekcji

4. **Sesja nauki**
   - Użytkownik wybiera opcję nauki
   - System prezentuje fiszki według algorytmu spaced repetition
   - Użytkownik przegląda fiszki, odwraca je i oznacza jako przyswojone lub wymagające powtórki
   - Po zakończeniu sesji prezentowane jest podsumowanie

5. **Zarządzanie kolekcjami i fiszkami**
   - Użytkownik przegląda swoje kolekcje
   - Może tworzyć nowe kolekcje/kategorie
   - Może przeglądać, edytować i usuwać fiszki
   - Może przenosić fiszki między kolekcjami

6. **Śledzenie postępów**
   - Użytkownik regularnie przegląda statystyki nauki
   - Obserwuje efektywność generowania fiszek przez AI
   - Dostosowuje swoje podejście do nauki na podstawie statystyk

### Kluczowy przypadek użycia: Generowanie i nauka z fiszkami

1. Użytkownik wybiera opcję "Generuj fiszki" z dashboardu
2. Wprowadza tekst źródłowy do pola tekstowego, obserwując licznik znaków
3. System waliduje długość tekstu (1000-10000 znaków)
4. Użytkownik wybiera istniejącą kolekcję lub tworzy nową
5. Klika przycisk "Generuj"
6. System przetwarza tekst i generuje 5-15 fiszek
7. Użytkownik jest przekierowany do ekranu recenzji
8. Dla każdej fiszki użytkownik:
   - Przegląda front i back (odwracając kartę)
   - Akceptuje fiszkę, odrzuca ją lub edytuje
   - W przypadku edycji, modyfikuje treść z walidacją limitów znaków
9. Po przeglądzie wszystkich fiszek klika "Dalej"
10. Na ekranie zapisywania:
    - Widzi podsumowanie zaakceptowanych fiszek
    - Może zmienić kolekcję/kategorię dla wszystkich fiszek
    - Zatwierdza i zapisuje fiszki klikając "Zapisz"
11. System potwierdza zapisanie fiszek i aktualizuje statystyki
12. Użytkownik jest przekierowany do widoku szczegółów kolekcji
13. Może od razu rozpocząć sesję nauki z nowymi fiszkami

## 4. Układ i struktura nawigacji

### Nawigacja główna

Nawigacja główna jest stale widoczna na górze ekranu (w formie poziomego menu na dużych ekranach lub menu hamburgerowego na małych) i zawiera następujące elementy:

- Logo (przekierowanie na dashboard)
- Dashboard
- Kolekcje
- Generuj fiszki
- Ucz się
- Statystyki
- Profil użytkownika (menu rozwijane z opcjami)
  - Mój profil
  - Ustawienia
  - Wyloguj się

### Nawigacja kontekstowa

W zależności od aktualnego widoku, pod nawigacją główną może pojawić się nawigacja kontekstowa:

- **W widoku kolekcji**: przyciski tworzenia nowej kolekcji, filtrowania, sortowania
- **W szczegółach kolekcji**: zakładki (Wszystkie fiszki, Do nauki, Przyswojone)
- **W procesie generowania**: pasek postępu z krokami (Wprowadzanie tekstu → Recenzja → Zapisanie)
- **W sesji nauki**: licznik fiszek, pozostały czas, opcje sesji

### Ścieżki nawigacyjne

System wykorzystuje "breadcrumbs" dla głębszych poziomów nawigacji, np.:
- Dashboard > Kolekcje > [Nazwa kolekcji] > Edytuj fiszkę
- Dashboard > Generuj fiszki > Recenzja

### Nawigacja mobilna

W wersji mobilnej:
- Menu główne zwijane jest do ikony hamburgerowej
- Zastosowano większe przyciski akcji dla łatwiejszej interakcji dotykowej
- Uproszczono niektóre widoki dla lepszego dopasowania do mniejszych ekranów

## 5. Kluczowe komponenty

### Komponenty nawigacyjne

#### MainNavbar
- Główny pasek nawigacji aplikacji
- Zawiera logo, linki nawigacyjne i menu użytkownika
- Dostosowuje się do różnych rozmiarów ekranu

#### BreadcrumbTrail
- Wyświetla ścieżkę nawigacyjną
- Umożliwia szybki powrót do poprzednich poziomów

#### ProgressStepper
- Prezentuje etapy procesu wielokrokowego
- Wskazuje aktualny krok i umożliwia nawigację między krokami

### Komponenty fiszek

#### FlashcardCard
- Podstawowy komponent wyświetlający fiszkę
- Obsługuje odwracanie między front i back
- Skaluje się responsywnie do różnych rozmiarów ekranu

#### FlashcardList
- Wyświetla listę fiszek w formie siatki lub listy
- Umożliwia sortowanie i filtrowanie
- Obsługuje paginację dla dużych zbiorów

#### FlashcardEditor
- Formularz do tworzenia i edycji fiszek
- Zawiera walidację limitów znaków
- Obsługuje przypisywanie do kolekcji i kategorii

### Komponenty formularzy

#### TextareaWithCounter
- Pole tekstowe z licznikiem znaków
- Waliduje wprowadzony tekst względem limitów
- Wizualnie sygnalizuje przekroczenie limitów

#### CollectionSelect
- Dropdown do wyboru kolekcji
- Umożliwia wyszukiwanie i tworzenie nowej kolekcji

#### CategorySelect
- Dropdown do wyboru kategorii
- Umożliwia wyszukiwanie i tworzenie nowej kategorii

### Komponenty informacyjne

#### StatisticsCard
- Wyświetla kluczowe metryki w formie karty
- Może zawierać mini-wykresy i wskaźniki

#### NotificationAlert
- Wyświetla powiadomienia systemowe
- Różne typy: sukces, błąd, informacja, ostrzeżenie

#### EmptyState
- Wyświetla informację i sugestie, gdy lista jest pusta
- Zachęca do działania (np. "Utwórz pierwszą fiszkę")

### Komponenty akcji

#### ActionButton
- Podstawowy przycisk z możliwością różnych stanów
- Warianty: primary, secondary, danger, success

#### ConfirmationModal
- Modal wymagający potwierdzenia akcji
- Wyjaśnia konsekwencje akcji i wymaga świadomej decyzji

#### LoadingSpinner
- Indicator ładowania dla procesów asynchronicznych
- Różne rozmiary i style dla różnych kontekstów 