# 10xDevFiszki

Aplikacja edukacyjna do nauki z fiszkami napędzana sztuczną inteligencją, zbudowana w oparciu o nowoczesne technologie webowe, zaprojektowana w celu zwiększenia efektywności nauki poprzez automatyczne generowanie fiszek i algorytmy powtórek rozłożonych w czasie.

## Spis treści

- [Opis projektu](#opis-projektu)
- [Stos technologiczny](#stos-technologiczny)
- [Uruchomienie lokalne](#uruchomienie-lokalne)
- [Dostępne skrypty](#dostępne-skrypty)
- [Zakres projektu](#zakres-projektu)
- [Status projektu](#status-projektu)
- [Licencja](#licencja)

## Opis projektu

10xDevFiszki rozwiązuje problem czasochłonnego ręcznego tworzenia fiszek edukacyjnych poprzez zapewnienie inteligentnego rozwiązania, które łączy generowanie napędzane sztuczną inteligencją z sprawdzonymi metodami nauki opartymi na powtórkach rozłożonych w czasie. Aplikacja pozwala użytkownikom wprowadzać treści tekstowe i automatycznie generuje wysokiej jakości fiszki, jednocześnie wspierając ręczne tworzenie i kompleksowe sesje nauki.

### Kluczowe funkcje

- **Generowanie z AI**: Wprowadź 1000-10000 znaków tekstu i otrzymaj 5-15 zoptymalizowanych kandydatów na fiszki
- **System recenzji**: Akceptuj, odrzucaj lub edytuj fiszki generowane przez AI przed dodaniem do kolekcji
- **Ręczne tworzenie**: Twórz fiszki ręcznie z niestandardowymi kategoriami i kolekcjami
- **Powtórki rozłożone w czasie**: Zintegrowany algorytm SM-2 dla optymalnych harmonogramów nauki
- **Sesje nauki**: Interaktywna nauka ze śledzeniem postępów
- **Statystyki**: Kompleksowa analityka dotycząca generowania i postępów w nauce
- **Zarządzanie kontem**: Pełna autentykacja użytkowników zgodna z RODO

## Stos technologiczny

### Frontend
- **Astro 5** - Szybki, wydajny framework aplikacji webowych z minimalną ilością JavaScript
- **React 19** - Interaktywne komponenty tam, gdzie są potrzebne
- **TypeScript 5** - Statyczne typowanie i ulepszone wsparcie IDE
- **Tailwind CSS 4** - Framework stylowania oparty na narzędziach
- **Shadcn/ui** - Dostępna biblioteka komponentów React

### Backend
- **Supabase** - Kompletne rozwiązanie backend-as-a-service
  - Baza danych PostgreSQL
  - Wbudowana autentykacja użytkowników
  - Możliwości czasu rzeczywistego
  - Open-source z opcjami samodzielnego hostingu

### Integracja z AI
- **OPENROUTER.ai** - Dostęp do szerokiej gamy modeli AI (OpenRouter API, Anthropic, Google i wiele innych) do generowania fiszek
- Optymalizacja kosztów i limity finansowe na klucze API

### DevOps i Hosting
- **GitHub Actions** - Pipeline'y CI/CD
- **DigitalOcean** - Hosting aplikacji poprzez kontenery Docker
- **Docker** - Wdrożenie konteneryzowane

## Uruchomienie lokalne

### Wymagania wstępne

- Node.js w wersji 22.14.0 (użyj nvm: `nvm use`)
- Menedżer pakietów npm lub yarn
- Konto i projekt Supabase
- Dostęp do OpenRouter.ai API

### Instalacja

1. **Sklonuj repozytorium**
   ```bash
   git clone https://github.com/zrudnicki/10xDevFiszki.git
   cd 10xDevFiszki
   ```

2. **Zainstaluj zależności**
   ```bash
   npm install
   ```

3. **Skonfiguruj zmienne środowiskowe**
   Utwórz plik `.env` w katalogu głównym:
   ```env
   SUPABASE_URL=url_twojego_projektu_supabase
   SUPABASE_KEY=twoj_klucz_anon_supabase
   OPENROUTER_API_KEY=twoj_klucz_api_openrouter
   ```

4. **Uruchom serwer deweloperski**
   ```bash
   npm run dev
   ```

5. **Otwórz przeglądarkę**
   Przejdź do `http://localhost:3000`

## Dostępne skrypty

- `npm run dev` - Uruchom serwer deweloperski z hot reload
- `npm run build` - Utwórz zoptymalizowaną wersję produkcyjną
- `npm run preview` - Podejrzyj wersję produkcyjną lokalnie
- `npm run lint` - Uruchom analizę kodu ESLint
- `npm run lint:fix` - Automatycznie napraw problemy ESLint
- `npm run format` - Sformatuj kod za pomocą Prettier

## Zakres projektu

### Zawarte funkcje
- Generowanie fiszek z AI z walidacją wprowadzanych danych
- Ręczne tworzenie fiszek z kategoriami i kolekcjami
- System recenzji i edycji fiszek
- Nauka z powtórkami rozłożonymi w czasie z algorytmem SM-2
- Autentykacja użytkowników i zarządzanie kontem
- Statystyki nauki i śledzenie postępów
- Obsługa danych zgodna z RODO

### Aktualne ograniczenia
- Tylko aplikacja webowa (brak aplikacji mobilnych)
- Brak obsługi multimediów (obrazy, audio, wideo) w MVP
- Brak udostępniania fiszek między użytkownikami
- Brak importu z formatów zewnętrznych (PDF, DOCX)
- Wykorzystuje istniejący algorytm open-source (brak niestandardowych powtórek rozłożonych w czasie)

### Metryki sukcesu
- 75% fiszek generowanych przez AI akceptowanych przez użytkowników
- 75% wszystkich fiszek utworzonych poprzez generowanie AI
- Średni czas recenzji poniżej 2 minut na sesję

## Status projektu

🚧 **W trakcie rozwoju** - Faza MVP

Aplikacja jest obecnie w aktywnym rozwoju, skupiając się na implementacji podstawowych funkcjonalności. Kluczowe funkcje w trakcie rozwoju:

- [x] Konfiguracja projektu i architektura
- [x] Integracja z Supabase
- [x] Podstawowe komponenty UI
- [ ] Generowanie fiszek z AI
- [ ] System recenzji
- [ ] Sesje nauki
- [ ] Panel statystyk
- [ ] Integracja z algorytmem SM-2

## Licencja

Ten projekt jest licencjonowany na [Licencji MIT](LICENSE) - zobacz plik LICENSE, aby uzyskać szczegóły.

---

**Współpraca**: Zapraszamy do współpracy! Proszę przeczytać nasze wytyczne dotyczące współpracy przed przesłaniem pull requestów.

**Wsparcie**: W przypadku pytań lub problemów, proszę otworzyć issue na GitHub lub skontaktować się z zespołem deweloperskim. 