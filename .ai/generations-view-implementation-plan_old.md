# Plan implementacji widoku generowania fiszek przez AI

## 1. Przegląd
Widok generowania fiszek przez AI to kluczowy komponent aplikacji Fiszki, który umożliwia użytkownikom generowanie fiszek edukacyjnych na podstawie wprowadzonego tekstu. Proces składa się z trzech głównych kroków: wprowadzania tekstu źródłowego, recenzji wygenerowanych fiszek oraz ich zapisywania do kolekcji. Widok integruje się z endpointem AI do generowania fiszek oraz zapewnia intuicyjny interfejs do interakcji z wygenerowaną zawartością.

## 2. Routing widoku
Implementacja widoku generowania fiszek będzie dostępna pod następującymi ścieżkami:
- `/generator/input` - Etap wprowadzania tekstu
- `/generator/review` - Etap recenzji wygenerowanych fiszek
- `/generator/save` - Etap zapisywania zaakceptowanych fiszek

Dla zapewnienia spójnej nawigacji zastosujemy podejście oparte na etapach procesu generowania.

## 3. Struktura komponentów

Widok generowania fiszek składa się z trzech głównych stron, każda z własnymi komponentami:

### Strona wprowadzania tekstu (`/generator/input`)
```
GeneratorLayout
└── GeneratorInputPage
    ├── GeneratorHeader
    ├── TextInputForm
    │   ├── TextareaWithCounter
    │   └── GeneratorOptionsForm
    │       ├── CollectionSelect
    │       └── CategorySelect
    └── GeneratorFooter
        └── SubmitButton
```

### Strona recenzji fiszek (`/generator/review`)
```
GeneratorLayout
└── GeneratorReviewPage
    ├── GeneratorHeader
    ├── FlashcardReviewList
    │   ├── FlashcardReviewItem (wielokrotnie)
    │   │   ├── FlashcardReviewCard
    │   │   │   ├── FlashcardFront
    │   │   │   └── FlashcardBack
    │   │   └── FlashcardActionButtons
    │   └── FlashcardEditModal
    └── GeneratorFooter
        ├── BackButton
        └── NextButton
```

### Strona zapisywania fiszek (`/generator/save`)
```
GeneratorLayout
└── GeneratorSavePage
    ├── GeneratorHeader
    ├── AcceptedFlashcardsList
    │   └── FlashcardSummaryItem (wielokrotnie)
    ├── CollectionAssignmentForm
    │   ├── CollectionSelect
    │   └── CategorySelect
    └── GeneratorFooter
        ├── BackButton
        └── SaveButton
```

## 4. Szczegóły komponentów

### 4.1. Strona wprowadzania tekstu

#### GeneratorLayout
- **Opis komponentu**: Główny kontener dla wszystkich stron generatora, zapewniający spójny układ i wspólne elementy.
- **Główne elementy**: Container, Header, Footer, pasek postępu procesu generacji.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji.
- **Propsy**:
  ```typescript
  interface GeneratorLayoutProps {
    children: React.ReactNode;
    currentStep: number;
    totalSteps: number;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### GeneratorHeader
- **Opis komponentu**: Nagłówek dla procesu generowania zawierający tytuł oraz pasek postępu.
- **Główne elementy**: Tytuł strony, pasek postępu, opis aktualnego kroku.
- **Propsy**:
  ```typescript
  interface GeneratorHeaderProps {
    title: string;
    description?: string;
    currentStep: number;
    totalSteps: number;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### TextInputForm
- **Opis komponentu**: Formularz do wprowadzania tekstu źródłowego dla generacji fiszek.
- **Główne elementy**: TextareaWithCounter, GeneratorOptionsForm, przyciski nawigacyjne.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, zmiana opcji generowania, wysłanie formularza.
- **Obsługiwana walidacja**: 
  - Długość tekstu (min. 1000, max. 10000 znaków)
  - Błędy przy wysłaniu formularza
- **Propsy**:
  ```typescript
  interface TextInputFormProps {
    onSubmit: (data: GeneratorInputData) => Promise<void>;
    isSubmitting: boolean;
    initialCollectionId?: string;
    initialCategoryId?: string;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### TextareaWithCounter
- **Opis komponentu**: Pole tekstowe z licznikiem znaków pokazującym aktualną długość względem wymaganych granic.
- **Główne elementy**: Textarea, licznik znaków, wskaźnik walidacji.
- **Obsługiwane interakcje**: Wprowadzanie tekstu, sledzenielimitu znaków.
- **Obsługiwana walidacja**: 
  - Minimalna długość (1000 znaków)
  - Maksymalna długość (10000 znaków)
  - Wskaźnik wizualny stanu (za krótki / OK / za długi)
- **Propsy**:
  ```typescript
  interface TextareaWithCounterProps {
    value: string;
    onChange: (value: string) => void;
    minLength: number;
    maxLength: number;
    placeholder?: string;
    error?: string;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### GeneratorOptionsForm
- **Opis komponentu**: Formularz zawierający opcje generowania fiszek, takie jak wybrana kolekcja i kategoria.
- **Główne elementy**: CollectionSelect, CategorySelect.
- **Obsługiwane interakcje**: Wybór kolekcji i kategorii.
- **Propsy**:
  ```typescript
  interface GeneratorOptionsFormProps {
    selectedCollectionId: string | null;
    selectedCategoryId: string | null;
    onCollectionChange: (id: string | null) => void;
    onCategoryChange: (id: string | null) => void;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### CollectionSelect
- **Opis komponentu**: Komponent do wyboru kolekcji z list rozwijalnej z możliwością wyszukiwania.
- **Główne elementy**: Select z ComboBox, opcja "Brak" i "Nowa kolekcja".
- **Obsługiwane interakcje**: Wybór kolekcji z listy, wyszukiwanie, tworzenie nowej.
- **Propsy**:
  ```typescript
  interface CollectionSelectProps {
    selectedId: string | null;
    onChange: (id: string | null) => void;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### CategorySelect
- **Opis komponentu**: Komponent do wyboru kategorii z listy rozwijalnej z możliwością wyszukiwania.
- **Główne elementy**: Select z ComboBox, opcja "Brak" i "Nowa kategoria".
- **Obsługiwane interakcje**: Wybór kategorii z listy, wyszukiwanie, tworzenie nowej.
- **Propsy**:
  ```typescript
  interface CategorySelectProps {
    selectedId: string | null;
    onChange: (id: string | null) => void;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### GeneratorFooter
- **Opis komponentu**: Stopka zawierająca przyciski nawigacyjne dla procesu generowania.
- **Główne elementy**: Przyciski nawigacyjne (Wstecz, Dalej, Generuj, Zapisz).
- **Obsługiwane interakcje**: Nawigacja między etapami procesu.
- **Propsy**:
  ```typescript
  interface GeneratorFooterProps {
    onBack?: () => void;
    onNext?: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
    isNextDisabled?: boolean;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```

#### SubmitButton
- **Opis komponentu**: Przycisk do wysyłania formularza z obsługą stanu ładowania.
- **Główne elementy**: Button z animowanym spinnerem dla stanu ładowania.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface SubmitButtonProps {
    label: string;
    isLoading?: boolean;
    isDisabled?: boolean;
    onClick?: () => void;
  }
  ```

### 4.2. Strona recenzji fiszek

#### GeneratorReviewPage
- **Opis komponentu**: Strona wyświetlająca wygenerowane fiszki do recenzji i umożliwiająca ich akceptację/edycję.
- **Główne elementy**: GeneratorHeader, FlashcardReviewList, GeneratorFooter.
- **Obsługiwane interakcje**: Akceptacja/edycja/odrzucenie fiszek, nawigacja między krokami.
- **Propsy**:
  ```typescript
  interface GeneratorReviewPageProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled: boolean;
  }
  ```

#### FlashcardReviewList
- **Opis komponentu**: Lista wygenerowanych fiszek do recenzji.
- **Główne elementy**: Lista FlashcardReviewItem, animacja przeładowania.
- **Obsługiwane interakcje**: Przewijanie listy.
- **Propsy**:
  ```typescript
  interface FlashcardReviewListProps {
    flashcards: GeneratedFlashcard[];
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
    isLoading?: boolean;
  }
  ```

#### FlashcardReviewItem
- **Opis komponentu**: Element listy reprezentujący pojedynczą fiszkę do recenzji.
- **Główne elementy**: FlashcardReviewCard, FlashcardActionButtons.
- **Obsługiwane interakcje**: Przeglądanie fiszki, akceptacja, edycja, odrzucenie.
- **Propsy**:
  ```typescript
  interface FlashcardReviewItemProps {
    flashcard: GeneratedFlashcard;
    onAccept: (flashcard: GeneratedFlashcard) => void;
    onReject: (flashcardId: string) => void;
    onEdit: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### FlashcardReviewCard
- **Opis komponentu**: Karta prezentująca zawartość fiszki (front i back).
- **Główne elementy**: Karty z zawartością front i back, animacja odwracania.
- **Obsługiwane interakcje**: Kliknięcie w celu odwrócenia karty.
- **Propsy**:
  ```typescript
  interface FlashcardReviewCardProps {
    front: string;
    back: string;
  }
  ```

#### FlashcardFront
- **Opis komponentu**: Komponent wyświetlający przednią stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardFrontProps {
    content: string;
  }
  ```

#### FlashcardBack
- **Opis komponentu**: Komponent wyświetlający tylną stronę fiszki.
- **Główne elementy**: Tekst, formatowanie.
- **Propsy**:
  ```typescript
  interface FlashcardBackProps {
    content: string;
  }
  ```

#### FlashcardActionButtons
- **Opis komponentu**: Zestaw przycisków do podejmowania akcji na fiszce (akceptuj, edytuj, odrzuć).
- **Główne elementy**: Przyciski akcji z ikonami.
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Propsy**:
  ```typescript
  interface FlashcardActionButtonsProps {
    onAccept: () => void;
    onReject: () => void;
    onEdit: () => void;
    isAccepted?: boolean;
    isRejected?: boolean;
  }
  ```

#### FlashcardEditModal
- **Opis komponentu**: Modal do edycji zawartości fiszki.
- **Główne elementy**: Formularz z polami front i back, przyciski akcji.
- **Obsługiwane interakcje**: Edycja pól, zatwierdzanie zmian, anulowanie.
- **Obsługiwana walidacja**:
  - Długość front (max. 200 znaków)
  - Długość back (max. 500 znaków)
- **Propsy**:
  ```typescript
  interface FlashcardEditModalProps {
    flashcard: GeneratedFlashcard;
    isOpen: boolean;
    onClose: () => void;
    onSave: (flashcard: GeneratedFlashcard) => void;
  }
  ```

#### BackButton
- **Opis komponentu**: Przycisk powrotu do poprzedniego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie.
- **Propsy**:
  ```typescript
  interface BackButtonProps {
    onClick: () => void;
    label?: string;
  }
  ```

#### NextButton
- **Opis komponentu**: Przycisk przejścia do następnego kroku.
- **Główne elementy**: Button z ikoną strzałki.
- **Obsługiwane interakcje**: Kliknięcie, stan dezaktywowany.
- **Propsy**:
  ```typescript
  interface NextButtonProps {
    onClick: () => void;
    isDisabled?: boolean;
    label?: string;
  }
  ```
