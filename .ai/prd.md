# Dokument wymagań produktu (PRD) - Fiszki

## 1. Przegląd produktu
Fiszki to aplikacja webowa umożliwiająca użytkownikom generowanie i przeglądanie fiszek edukacyjnych. Aplikacja integruje się z zewnętrznym algorytmem powtórek open-source, wykorzystuje Supabase do przechowywania danych oraz oferuje prosty interfejs do generowania fiszek przez AI i ręcznego tworzenia.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca do systematycznego korzystania z metody spaced repetition.

## 3. Wymagania funkcjonalne
1. Generowanie fiszek przez AI
  - Wejście: tekst o długości od 1000 do 10000 znaków
  - Wyjście: lista kandydatów fiszek (min. 5, max. 15)
  - Format fiszek ograniczony do pól:
    - Front (klucz, do 200 znaków)
    - Back (wartość, do 500 znaków)

2. Ręczne tworzenie fiszek
  - Formularz z polami Front i Back oraz możliwością dodawania własnych tagów

3. Recenzja fiszek
  - Interfejs z przyciskami „Akceptuj” i „Wymaga powtórki”
  - Bulk zapis zaakceptowanych fiszek do bazy Supabase

4. Zarządzanie kontem
  - Rejestracja, logowanie i usuwanie konta (z potwierdzeniem akcji)

5. Integracja z algorytmem powtórek
  - Synchronizacja zaakceptowanych fiszek z biblioteką open-source

6. Walidacja danych
  - Frontend, backend i baza danych walidują zakres znaków dla każdego pola

7. Statystyki generowania fiszek:
  - zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.

8. Wymagania prawne i ograniczenia:
  - Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
  - Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) n awniosek użytkownika.

## 4. Granice produktu
- Brak zaawansowanego własnego algorytmu powtórek (tylko integracja z gotową biblioteką)
- Brak obsługi importu wieloplatformowego (PDF, DOCX itp.)
- Brak współdzielenia zestawów fiszek między użytkownikami
- Aplikacja dostępna wyłącznie jako aplikacja webowa
- Brak obsługi multimediów (obrazy, audio, wideo) w MVP

## 5. Historyjki użytkowników

- ID: US-001  
  Tytuł: Generowanie fiszek przez AI  
  Opis: Jako użytkownik chcę wprowadzić tekst (1000–10000 znaków), aby system wygenerował listę kandydatów fiszek.  
  Kryteria akceptacji:  
  - Po wprowadzeniu prawidłowej długości tekstu wyświetlona lista co najmniej 5 kandydatów fiszek  
  - Każda fiszka zawiera pola Front (≤200 znaków) i Back (≤500 znaków)  
  - W przypadku tekstu poza zakresem długości wyświetlony komunikat o błędzie

- ID: US-002  
  Tytuł: Ręczne tworzenie fiszek  
  Opis: Jako użytkownik chcę ręcznie utworzyć fiszkę, podając Front i Back
  Kryteria akceptacji:  
  - Formularz umożliwia dodanie pola Front (≤200 znaków) i Back (≤500 znaków)
  - Utworzone fiszki zapisywane są w bazie Supabase

- ID: US-003  
  Tytuł: Edycja istniejących fiszek  
  Opis: Jako użytkownik chcę edytować pola Front i Back istniejącej fiszki.  
  Kryteria akceptacji:  
  - Użytkownik może zaktualizować Front i Back fiszki  
  - Zmiany są zapisywane w bazie Supabase

- ID: US-004  
  Tytuł: Recenzja fiszek generowanych przez AI  
  Opis: Jako użytkownik chcę przeglądać kandydatów fiszek i oznaczać je jako „Akceptuj” lub „Wymaga powtórki”.  
  Kryteria akceptacji:  
  - Interfejs wyświetla przyciski „Akceptuj” i „Edytuj"  
  - Bulk zapis zaakceptowanych fiszek działa prawidłowo

- ID: US-005  
  Tytuł: Rejestracja i logowanie  
  Opis: Jako nowy użytkownik chcę założyć konto i zalogować się, aby zarządzać moimi fiszkami.  
  Kryteria akceptacji:  
  - Użytkownik może zarejestrować konto przez Supabase  
  - Po rejestracji następuje przekierowanie do pulpitu  
  - Walidacja pól formularza rejestracji

- ID: US-006  
  Tytuł: Usuwanie konta  
  Opis: Jako użytkownik chcę usunąć moje konto z potwierdzeniem akcji.  
  Kryteria akceptacji:  
  - System wyświetla modal z prośbą o potwierdzenie usunięcia  
  - Po potwierdzeniu konto jest usuwane, a dane archiwizowane

- ID: US-007  
  Tytuł: Oznaczanie fiszki jako przyswojonej lub wymagającej powtórki  
  Opis: Jako użytkownik chcę oznaczyć każdą fiszkę jako przyswojoną lub do powtórki podczas sesji nauki.  
  Kryteria akceptacji:  
  - Użytkownik ma dostęp do przycisków „Przyswojone” i „Wymaga powtórki”  
  - Oznaczenia są zapisywane w bazie i synchronizowane z algorytmem powtórek

## 6. Metryki sukcesu
- 75% fiszek generowanych przez AI jest akceptowanych przez użytkowników  
- 75% wszystkich utworzonych fiszek pochodzi z generacji przez AI  
- Średni czas potrzebny na przegląd fiszek przez użytkownika nie przekracza 2 minut na sesję
