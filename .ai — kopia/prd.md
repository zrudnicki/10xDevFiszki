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

2. Recenzja fiszek
  - Interfejs z przyciskami „Akceptuj" i „Wymaga powtórki"
  - Bulk zapis jako kolekcji zaakceptowanych fiszek do bazy Supabase

3. Ręczne tworzenie fiszek
  - Formularz z polami Front i Back oraz możliwością dodawania własnych kategorii
  - Możliwość dodania stworzonej fiszki do istniejącej lub nowej kolekcji

4. Walidacja danych
  - Frontend, backend i baza danych walidują zakres znaków dla każdego pola

5. Zarządzanie kontem
  - Rejestracja, logowanie i usuwanie konta (z potwierdzeniem akcji)

6. Integracja z algorytmem powtórek
  - Inicjalna konfiguracja i połączenie z biblioteką SM-2
  - Przechowywanie parametrów algorytmu dla każdej fiszki
  - Obliczanie następnych terminów powtórek

7. Nauka fiszek
  - Możliwość rozpoczęcia sesji nauki z wybranej kolekcji fiszek
  - Interfejs do oznaczania fiszek jako "Nauczone" lub "Wymaga powtórki"
  - Aktualizacja statusu nauki i zapisywanie odpowiedzi użytkownika

8. Statystyki generowania fiszek:
  - zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.

9. Wymagania prawne i ograniczenia:
  - Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
  - Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika.

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
  - Po wprowadzeniu prawidłowej długości tekstu wyświetlona lista co najmniej 5 kandydatów fiszek najwięcej 15 fiszek
  - Każda fiszka zawiera pola Front (≤200 znaków) i Back (≤500 znaków)  
  - W przypadku tekstu poza zakresem długości wyświetlony komunikat o błędzie

- ID: US-002  
  Tytuł: Recenzja fiszek  
  Opis: Jako użytkownik chcę przeglądać kandydatów fiszek i oznaczać je jako „Akceptuj" lub „Wymaga powtórki", aby wybrać te, które trafią do mojej kolekcji.  
  Kryteria akceptacji:  
  - Interfejs wyświetla przyciski „Akceptuj" i „Wymaga edycji"  
  - Możliwość edycji fiszki przed akceptacją  
  - Bulk zapis zaakceptowanych fiszek do bazy Supabase

- ID: US-003  
  Tytuł: Ręczne tworzenie fiszek  
  Opis: Jako użytkownik chcę ręcznie utworzyć fiszkę, podając Front i Back oraz przypisując ją do kategorii i kolekcji.  
  Kryteria akceptacji:  
  - Formularz umożliwia dodanie pola Front (≤200 znaków) i Back (≤500 znaków)  
  - Możliwość przypisania fiszki do istniejącej lub nowej kolekcji i kategorii  
  - Utworzone fiszki zapisywane są w bazie Supabase

- ID: US-004  
  Tytuł: Walidacja danych  
  Opis: Jako użytkownik chcę, aby aplikacja walidowała długość pól Front i Back na każdym etapie (frontend, backend, baza danych).  
  Kryteria akceptacji:  
  - Walidacja pól Front (≤200 znaków) i Back (≤500 znaków) na froncie, backendzie i w bazie danych  
  - W przypadku przekroczenia limitu wyświetlany jest komunikat o błędzie

- ID: US-005  
  Tytuł: Rejestracja  
  Opis: Jako użytkownik chcę móc się zarejestrować, aby uzyskać dostęp do aplikacji i moich fiszek.  
  Kryteria akceptacji:  
  - Możliwość rejestracji nowego konta  
  - Walidacja pól formularza rejestracji

- ID: US-006  
  Tytuł: Logowanie  
  Opis: Jako użytkownik chcę móc się zalogować, aby uzyskać dostęp do moich fiszek.  
  Kryteria akceptacji:  
  - Możliwość logowania na istniejące konto  
  - Walidacja pól formularza logowania

- ID: US-007  
  Tytuł: Usunięcie konta  
  Opis: Jako użytkownik chcę móc usunąć swoje konto (z potwierdzeniem), aby zarządzać swoimi danymi.  
  Kryteria akceptacji:  
  - Możliwość usunięcia konta z potwierdzeniem akcji  
  - Po potwierdzeniu konto i dane są usuwane

- ID: US-008  
  Tytuł: Integracja z algorytmem powtórek  
  Opis: Jako użytkownik chcę, aby zaakceptowane fiszki były synchronizowane z algorytmem powtórek SM-2.  
  Kryteria akceptacji:  
  - Po akceptacji fiszki są synchronizowane z biblioteką open-source SM-2

- ID: US-009  
  Tytuł: Nauka fiszek  
  Opis: Jako użytkownik chcę rozpocząć sesję nauki z wybranej kolekcji fiszek i oznaczać je jako "Nauczone" lub "Wymaga powtórki".  
  Kryteria akceptacji:  
  - Możliwość wyboru kolekcji fiszek do nauki
  - Interfejs do oznaczania fiszek jako "Nauczone" lub "Wymaga powtórki"
  - System zapisuje odpowiedzi i aktualizuje status nauki
  - Parametry algorytmu SM-2 są aktualizowane na podstawie odpowiedzi

- ID: US-010  
  Tytuł: Statystyki generowania fiszek  
  Opis: Jako użytkownik chcę widzieć statystyki dotyczące liczby wygenerowanych i zaakceptowanych fiszek.  
  Kryteria akceptacji:  
  - System zbiera i prezentuje statystyki generowania i akceptacji fiszek

- ID: US-011  
  Tytuł: Wymagania prawne i ograniczenia  
  Opis: Jako użytkownik chcę mieć pewność, że moje dane są przechowywane zgodnie z RODO i mogę zażądać ich usunięcia.  
  Kryteria akceptacji:  
  - Dane przechowywane zgodnie z RODO  
  - Możliwość wglądu i usunięcia danych na wniosek użytkownika

## 6. Metryki sukcesu
- 75% fiszek generowanych przez AI jest akceptowanych przez użytkowników  
- 75% wszystkich utworzonych fiszek pochodzi z generacji przez AI  
- Średni czas potrzebny na przegląd fiszek przez użytkownika nie przekracza 2 minut na sesję
