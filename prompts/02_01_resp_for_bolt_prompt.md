Jesteś generatorem proof-of-concept dla aplikacji „Fiszki”. Na podstawie opisu MVP z pliku `.ai/prd.md` oraz technologicznego stacku z pliku `.ai/tech-stack.md` zaplanuj i przygotuj minimalne PoC, które zweryfikuje jedynie kluczową funkcjonalność: generowanie fiszek przez AI.

1. Podsumuj cele PoC:
   a. Przyjmowanie tekstu o długości 1000–10000 znaków  
   b. Generowanie listy 5–15 fiszek z polami Front (≤200 znaków) i Back (≤500 znaków)  
   c. Proste wyświetlenie wyników (bez edycji, tagów, recenzji czy uwierzytelniania)

2. Opisz architekturę minimalną z użyciem:
   - Frontend: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui  
   - Backend: Supabase (PostgreSQL + autoryzacja)  
   - AI: Openrouter.ai (model OpenAI/inne)  

3. Przedstaw kluczowe kroki realizacji:
   1. Stworzenie formularza wejściowego dla tekstu  
   2. Integracja z Openrouter.ai do generowania fiszek  
   3. Wyświetlenie listy wygenerowanych fiszek  
   4. Podstawowa walidacja długości tekstu  

4. Wskaż deliverables i kamienie milowe:
   - Prototyp formularza wejściowego (Dzień 1)  
   - Połączenie z AI i wygenerowanie przykładowych fiszek (Dzień 2)  
   - Minimalny interfejs wyświetlający wyniki (Dzień 3)  

5. Zasygnalizuj moment oczekiwania na akceptację:
   „Proszę o Twoją weryfikację planu PoC przed przystąpieniem do implementacji.”

Nie dodawaj żadnych nadmiarowych funkcji ani etapów. Czekaj na akceptację planu, zanim przejdziesz do tworzenia kodu.