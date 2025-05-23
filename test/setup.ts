/**
 * Plik konfiguracyjny dla środowiska testowego Vitest
 * 
 * Ten plik jest ładowany automatycznie przez Vitest przed uruchomieniem testów
 * i konfiguruje globalne ustawienia oraz mocki wymagane przez testy.
 */

import { vi } from 'vitest';

// Ustawienie zmiennych środowiskowych dla testów
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'mock-gemini-api-key';

// Wycisz niektóre logi, aby uprościć wyjście testów
console.info = vi.fn();
// Zachowaj console.error do debugowania
// console.error = vi.fn();

// Opcjonalnie: Mockuj fetch, jeśli testy nie mogą łączyć się z rzeczywistymi API
// global.fetch = vi.fn();

// Wycisz niektóre logi, aby uprościć wyjście testów
console.info = vi.fn();
// Zachowaj console.error do debugowania
// console.error = vi.fn();

// Tutaj możesz dodać inne konfiguracje globalne wymagane przez testy
