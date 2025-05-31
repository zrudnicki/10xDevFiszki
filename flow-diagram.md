# Flow Diagram - 10xDevFiszki

```mermaid
flowchart TD
    A[Start] --> B{Czy użytkownik jest zalogowany?}
    B -- Nie --> C[Rejestracja / Logowanie]
    C --> D[Przekierowanie do pulpitu]
    B -- Tak --> D
    D --> E{Co chcesz zrobić?}
    E -- Generuj fiszki AI --> F[Wprowadź tekst (1000-10000 znaków)]
    F --> G[AI generuje kandydatów fiszek]
    G --> H[Recenzja fiszek: Akceptuj / Wymaga powtórki / Edytuj]
    H --> I[Bulk zapis zaakceptowanych fiszek do Supabase]
    E -- Ręcznie utwórz fiszkę --> J[Formularz: Front, Back, tagi]
    J --> K[Zapis fiszki do Supabase]
    E -- Przeglądaj / Edytuj fiszki --> L[Lista fiszek]
    L --> M[Edycja: Front, Back]
    M --> N[Zapis zmian do Supabase]
    E -- Nauka fiszek --> O[Sesja nauki]
    O --> P[Oznacz fiszkę: Przyswojone / Do powtórki]
    P --> Q[Zapis oznaczeń i synchronizacja z algorytmem powtórek]
    E -- Zarządzaj kontem --> R[Usuwanie konta]
    R --> S[Potwierdzenie akcji]
    S --> T[Usunięcie konta i danych]
    I --> U[Statystyki generowania fiszek]
    K --> U
    N --> U
    Q --> U
    U --> V[Koniec]
    T --> V
```

---

Diagram przedstawia główne ścieżki użytkownika w aplikacji 10xDevFiszki zgodnie z wymaganiami PRD. 