# Plan implementacji widoku sesji nauki

## 1. Przegląd
Widok sesji nauki to kluczowy element aplikacji Fiszki, umożliwiający użytkownikom przeglądanie fiszek do nauki zgodnie z algorytmem spaced repetition. Użytkownik przegląda fiszki po kolei, odwracając je (front/back) i oznaczając jako przyswojone lub wymagające powtórki. System zapisuje status każdej fiszki oraz aktualizuje datę następnej powtórki zgodnie z algorytmem.

## 2. Routing widoku
- **Ścieżka główna**: `/study`
- **Ścieżka z filtrami**: `/study?collection_id={uuid}&category_id={uuid}`

## 3. Struktura komponentów

```
StudySessionPage
├── SessionHeader
├── StudySession
│   ├── FlashcardDisplay
│   │   ├── FlashcardFront
│   │   └── FlashcardBack
│   └── FlashcardControls
├── SessionProgress
├── SessionActions
└── SessionSummary (widoczne po zakończeniu sesji)
```

## 4. Szczegóły komponentów

### StudySessionPage
- **Opis komponentu**: Główny kontener strony sesji nauki, odpowiedzialny za pobranie danych, zarządzanie stanem sesji i renderowanie wszystkich komponentów potomnych.
- **Główne elementy**: Nagłówek sesji, kontener sesji nauki, pasek postępu, przyciski akcji, podsumowanie sesji.
- **Obsługiwane interakcje**: Inicjalizacja sesji, zakończenie sesji, pauza/wznowienie.
- **Obsługiwana walidacja**: 
  - Sprawdzanie, czy użytkownik jest zalogowany
  - Sprawdzanie, czy są dostępne fiszki do nauki
- **Propsy**:
  ```typescript
  interface StudySessionPageProps {
    collectionId?: string;
    categoryId?: string;
  }
  ```

### SessionHeader
- **Opis komponentu**: Nagłówek zawierający tytuł sesji, nazwę kolekcji/kategorii i opcje sesji.
- **Główne elementy**: Tytuł, informacje o kolekcji/kategorii, przycisk powrotu do dashboardu.
- **Obsługiwane interakcje**: Nawigacja do dashboardu.
- **Propsy**:
  ```typescript
  interface SessionHeaderProps {
    title: string;
    collectionName?: string;
    categoryName?: string;
    onBackToDashboard: () => void;
  }
  ```

### StudySession
- **Opis komponentu**: Główny kontener sesji nauki, prezentujący aktualną fiszkę i przyciski kontrolne.
- **Główne elementy**: FlashcardDisplay, FlashcardControls.
- **Obsługiwane interakcje**: Przejście do następnej fiszki.
- **Propsy**:
  ```typescript
  interface StudySessionProps {
    currentFlashcard: SessionFlashcardViewModel | null;
    isFlipped: boolean;
    isSubmitting: boolean;
    onFlip: () => void;
    onMarkAsLearned: () => void;
    onMarkForReview: () => void;
  }
  ```

### FlashcardDisplay
- **Opis komponentu**: Komponent wyświetlający aktualną fiszkę, z możliwością odwracania między front/back.
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardDisplayProps {
    flashcard: SessionFlashcardViewModel;
    isFlipped: boolean;
    onFlip: () => void;
  }
  ```

### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie, opcjonalne informacje o kolekcji/kategorii.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
    collectionName?: string;
    categoryName?: string;
  }
  ```

### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

### FlashcardControls
- **Opis komponentu**: Zestaw przycisków kontrolnych do oznaczania statusu fiszki.
- **Główne elementy**: Przyciski "Przyswojone" i "Wymaga powtórki" z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków, skróty klawiszowe.
- **Propsy**:
  ```typescript
  interface FlashcardControlsProps {
    isSubmitting: boolean;
    onMarkAsLearned: () => void;
    onMarkForReview: () => void;
    showKeyboardShortcuts?: boolean;
  }
  ```

### SessionProgress
- **Opis komponentu**: Pasek postępu sesji nauki.
- **Główne elementy**: Pasek postępu, liczniki (aktualna/wszystkie fiszki).
- **Propsy**:
  ```typescript
  interface SessionProgressProps {
    currentIndex: number;
    totalFlashcards: number;
    learned: number;
    toReview: number;
  }
  ```

### SessionActions
- **Opis komponentu**: Przyciski akcji dla sesji (pauza, zakończ).
- **Główne elementy**: Przyciski z ikonami.
- **Obsługiwane interakcje**: Pauza/wznowienie sesji, zakończenie sesji.
- **Propsy**:
  ```typescript
  interface SessionActionsProps {
    isPaused: boolean;
    onPauseResume: () => void;
    onEnd: () => void;
  }
  ```

### SessionSummary
- **Opis komponentu**: Podsumowanie sesji po jej zakończeniu.
- **Główne elementy**: Statystyki sesji, przyciski dalszych akcji (nowa sesja, powrót).
- **Obsługiwane interakcje**: Rozpoczęcie nowej sesji, powrót do dashboardu.
- **Propsy**:
  ```typescript
  interface SessionSummaryProps {
    stats: {
      total: number;
      learned: number;
      toReview: number;
    };
    onStartNewSession: () => void;
    onBackToDashboard: () => void;
  }
  ```

## 5. Typy

### Typy z API (istniejące)
```typescript
interface FlashcardDueDto extends FlashcardDto {
  next_review_at: string;
}

interface FlashcardDto {
  id: string;
  front: string;
  back: string;
  collection_id: string | null;
  category_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type FlashcardReviewStatus = "learned" | "review";

interface FlashcardReviewDto {
  status: FlashcardReviewStatus;
}

interface FlashcardReviewResponseDto {
  id: string;
  status: FlashcardReviewStatus;
  next_review_at: string | null;
}
```

### Nowe typy ViewModel dla widoku
```typescript
interface SessionFlashcardViewModel {
  id: string;
  front: string;
  back: string;
  collection_id: string | null;
  category_id: string | null;
  is_flipped: boolean;          // Czy karta jest odwrócona
  review_status: FlashcardReviewStatus | null;  // Status przeglądu
  collection_name?: string;     // Opcjonalna nazwa kolekcji
  category_name?: string;      // Opcjonalna nazwa kategorii
}

interface SessionViewState {
  is_loading: boolean;          // Czy trwa ładowanie
  is_submitting: boolean;       // Czy trwa wysyłanie statusu
  is_completed: boolean;        // Czy sesja została zakończona
  is_paused: boolean;           // Czy sesja jest wstrzymana
  current_index: number;        // Indeks aktualnej fiszki
  flashcards: SessionFlashcardViewModel[];  // Lista fiszek w sesji
  error: string | null;         // Komunikat błędu
  stats: {
    total: number;              // Całkowita liczba fiszek
    learned: number;            // Liczba oznaczonych jako przyswojone
    to_review: number;          // Liczba oznaczonych do powtórki
  };
}

interface SessionOptions {
  collection_id?: string;       // Opcjonalny filtr kolekcji
  category_id?: string;         // Opcjonalny filtr kategorii
  limit?: number;               // Limit fiszek w sesji
}
```

## 6. Zarządzanie stanem

Dla efektywnego zarządzania stanem sesji nauki, implementujemy niestandardowy hook `useStudySession`:

```typescript
const useStudySession = (options?: SessionOptions) => {
  const [state, setState] = useState<SessionViewState>({
    is_loading: true,
    is_submitting: false,
    is_completed: false,
    is_paused: false,
    current_index: 0,
    flashcards: [],
    error: null,
    stats: { total: 0, learned: 0, to_review: 0 }
  });

  // Metody do zarządzania sesją:
  
  // Ładowanie fiszek z API
  const loadFlashcards = async () => {
    setState(prev => ({ ...prev, is_loading: true, error: null }));
    try {
      // Wywołaj API i załaduj fiszki
      // Przekształć odpowiedź na SessionFlashcardViewModel[]
      // Zaktualizuj stan
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        is_loading: false, 
        error: "Nie udało się załadować fiszek" 
      }));
    }
  };

  // Oznaczanie statusu fiszki
  const markFlashcard = async (status: FlashcardReviewStatus) => {
    if (state.is_submitting || state.flashcards.length === 0) return;
    
    const currentFlashcard = state.flashcards[state.current_index];
    
    setState(prev => ({ ...prev, is_submitting: true }));
    try {
      // Wywołaj API do oznaczenia statusu
      // Zaktualizuj statystyki
      // Przejdź do następnej fiszki lub zakończ sesję
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        is_submitting: false, 
        error: "Nie udało się zapisać statusu fiszki" 
      }));
    }
  };

  // Odwracanie fiszki
  const flipCard = () => {
    if (state.flashcards.length === 0) return;
    
    setState(prev => {
      const updatedFlashcards = [...prev.flashcards];
      updatedFlashcards[prev.current_index] = {
        ...updatedFlashcards[prev.current_index],
        is_flipped: !updatedFlashcards[prev.current_index].is_flipped
      };
      
      return {
        ...prev,
        flashcards: updatedFlashcards
      };
    });
  };

  // Przejście do następnej fiszki
  const nextFlashcard = () => {
    if (state.current_index >= state.flashcards.length - 1) {
      // Zakończ sesję, jeśli to ostatnia fiszka
      setState(prev => ({ ...prev, is_completed: true }));
    } else {
      // Przejdź do następnej fiszki
      setState(prev => ({ 
        ...prev, 
        current_index: prev.current_index + 1,
        flashcards: prev.flashcards.map((f, idx) => 
          idx === prev.current_index + 1 
            ? { ...f, is_flipped: false } 
            : f
        )
      }));
    }
  };

  // Dodatkowe metody: resetSession, pauseSession, resumeSession, etc.
  
  // Efekt inicjalizujący sesję
  useEffect(() => {
    loadFlashcards();
    
    // Hook czyszczący
    return () => {
      // Zapisz stan sesji jeśli potrzeba
    };
  }, []);

  return {
    state,
    loadFlashcards,
    markFlashcard,
    flipCard,
    nextFlashcard,
    // Inne metody...
  };
};
```

Dodatkowo, implementujemy hook obsługujący nawigację klawiaturą:

```typescript
const useKeyboardNavigation = (
  onFlip: () => void,
  onLearned: () => void,
  onReview: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ': // Spacja
          onFlip();
          break;
        case 'ArrowRight':
          onLearned();
          break;
        case 'ArrowLeft':
          onReview();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFlip, onLearned, onReview]);
};
```

## 7. Integracja API

Widok integruje się z następującymi endpointami API:

### 1. Pobieranie fiszek do nauki
```typescript
const fetchDueFlashcards = async (options?: SessionOptions) => {
  const url = new URL('/api/flashcards/due', window.location.origin);
  
  if (options?.collection_id) {
    url.searchParams.append('collection_id', options.collection_id);
  }
  
  if (options?.category_id) {
    url.searchParams.append('category_id', options.category_id);
  }
  
  if (options?.limit) {
    url.searchParams.append('limit', options.limit.toString());
  }
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch due flashcards');
  }
  
  const data = await response.json();
  return data.data as FlashcardDueDto[];
};
```

### 2. Oznaczanie statusu fiszki
```typescript
const markFlashcardStatus = async (
  flashcardId: string,
  status: FlashcardReviewStatus
) => {
  const response = await fetch(`/api/flashcards/${flashcardId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update flashcard status');
  }
  
  return await response.json() as FlashcardReviewResponseDto;
};
```

## 8. Interakcje użytkownika

### Wczytanie sesji nauki
1. Użytkownik przechodzi do ścieżki `/study` (opcjonalnie z parametrami filtrowania)
2. System wyświetla loader podczas ładowania fiszek
3. Po załadowaniu wyświetlana jest pierwsza fiszka (front)

### Przeglądanie fiszki
1. Użytkownik ogląda przednią stronę fiszki (pytanie)
2. Użytkownik klika fiszkę lub naciska spację, aby odwrócić
3. System pokazuje tylną stronę fiszki (odpowiedź)

### Oznaczanie statusu fiszki
1. Po zapoznaniu się z treścią fiszki, użytkownik:
   - Klika przycisk "Przyswojone" lub naciska strzałkę w prawo, jeśli zapamiętał treść
   - Klika przycisk "Wymaga powtórki" lub naciska strzałkę w lewo, jeśli potrzebuje powtórzyć
2. System wyświetla spinner podczas przetwarzania
3. Po przetworzeniu system przechodzi do następnej fiszki

### Zakończenie sesji
1. Po przejrzeniu wszystkich fiszek, system wyświetla ekran podsumowania
2. Użytkownik widzi statystyki sesji (liczba przejrzanych, przyswojonych, do powtórki)
3. Użytkownik może:
   - Rozpocząć nową sesję z innymi fiszkami
   - Wrócić do dashboardu

### Pauza sesji
1. Użytkownik klika przycisk pauzy
2. System wstrzymuje sesję, wyświetlając odpowiedni komunikat
3. Użytkownik może wznowić sesję lub wrócić do dashboardu

## 9. Warunki i walidacja

### Walidacja statusu fiszki
- Status może być tylko "learned" lub "review"
- Walidacja po stronie klienta i serwera

### Walidacja sesji
- Sprawdzenie, czy są dostępne fiszki do nauki
- Obsługa przypadku braku fiszek do powtórki

### Walidacja autoryzacji
- Sprawdzenie, czy użytkownik jest zalogowany
- Przekierowanie do logowania, jeśli nie

### Walidacja parametrów URL
- Sprawdzenie, czy parametry collection_id i category_id są poprawnymi UUID
- Ignorowanie nieprawidłowych parametrów

## 10. Obsługa błędów

### Brak fiszek do nauki
```typescript
const NoFlashcardsView = ({ 
  onCreateFlashcards, 
  onBackToDashboard 
}: NoFlashcardsViewProps) => (
  <div className="flex flex-col items-center justify-center p-6 text-center">
    <h2 className="text-xl font-semibold mb-4">Brak fiszek do nauki</h2>
    <p className="mb-6">
      Nie masz żadnych fiszek, które wymagają powtórzenia. 
      Możesz utworzyć nowe fiszki lub wrócić później.
    </p>
    <div className="flex gap-4">
      <Button onClick={onCreateFlashcards}>
        Utwórz nowe fiszki
      </Button>
      <Button variant="outline" onClick={onBackToDashboard}>
        Wróć do pulpitu
      </Button>
    </div>
  </div>
);
```

### Błąd ładowania fiszek
```typescript
const ErrorView = ({ 
  error, 
  onRetry 
}: ErrorViewProps) => (
  <div className="flex flex-col items-center justify-center p-6 text-center">
    <h2 className="text-xl font-semibold mb-4">Wystąpił błąd</h2>
    <p className="mb-6 text-red-500">
      {error || "Nie udało się załadować fiszek. Spróbuj ponownie."}
    </p>
    <Button onClick={onRetry}>
      Spróbuj ponownie
    </Button>
  </div>
);
```

### Obsługa utraty połączenia
- Zapisywanie statusu sesji w localStorage
- Próba ponownego połączenia z serwerem
- Synchronizacja lokalnych zmian po przywróceniu połączenia

## 11. Kroki implementacji

1. **Przygotowanie struktur danych i typów**
   - Zdefiniowanie typów ViewModel
   - Implementacja mapperów z DTO API na modele widoku

2. **Implementacja hooków zarządzania stanem**
   - Implementacja useStudySession
   - Implementacja useKeyboardNavigation

3. **Implementacja komponentów UI**
   - Implementacja FlashcardDisplay z animacją odwracania
   - Implementacja FlashcardControls z obsługą statusów
   - Implementacja SessionProgress
   - Implementacja SessionActions

4. **Integracja z API**
   - Implementacja funkcji pobierania fiszek
   - Implementacja funkcji oznaczania statusu

5. **Implementacja widoku głównego StudySessionPage**
   - Kompozycja wszystkich komponentów
   - Obsługa routingu i parametrów URL

6. **Implementacja obsługi błędów**
   - Komponent ErrorView
   - Komponent NoFlashcardsView
   - Mechanizm retry

7. **Obsługa nawigacji klawiaturowej**
   - Integracja useKeyboardNavigation z widokiem
   - Dodanie tooltipów ze skrótami klawiaturowymi

8. **Implementacja podsumowania sesji**
   - Komponent SessionSummary
   - Wyświetlanie statystyk

9. **Optymalizacje**
    - Zapisywanie stanu sesji między navigacjami
    - Implementacja mechanizmu pauzy/wznowienia
    - Dodanie opcji personalizacji sesji 