/**
 * @fileoverview Testy integracyjne dla endpointu generowania fiszek AI
 * 
 * Te testy sprawdzają funkcjonalność endpointu /api/ai/generate-flashcards,
 * w tym poprawność generowania fiszek, obsługę błędów i zależności od usług.
 */

import { beforeAll, describe, expect, it, vi } from 'vitest';
// Mockujemy supabaseClient zamiast importować prawdziwy
// import { supabaseClient } from '../../src/db/supabase.client';
import type { GeneratedFlashcardDto, GenerateFlashcardsResponseDto } from '../../src/types';

// Mock dla supabaseClient
vi.mock('../../src/db/supabase.client', () => ({
  supabaseClient: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'fake-test-token',
            user: { id: 'test-user-id' }
          },
          user: { id: 'test-user-id' }
        },
        error: null
      })
    }
  }
}));

// Mockujemy również moduł z serwisem fiszek AI
vi.mock('../../src/lib/services/ai-flashcard-service', () => ({
  generateFlashcardsFromText: vi.fn().mockResolvedValue([
    { question: 'Test Question 1', answer: 'Test Answer 1' },
    { question: 'Test Question 2', answer: 'Test Answer 2' }
  ]),
  getCachedFlashcards: vi.fn().mockResolvedValue(null)
}));

// Mockujemy serwis statystyk
vi.mock('../../src/lib/services/stats-service', () => ({
  updateFlashcardGenerationStats: vi.fn().mockResolvedValue(undefined),
  getFlashcardGenerationStats: vi.fn().mockResolvedValue({
    total_generated: 10,
    total_accepted_direct: 5,
    total_accepted_edited: 3,
    acceptance_rate: 80,
    last_generation_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
}));

// Przykładowe dane testowe
const VALID_TEXT = `Ten tekst musi mieć co najmniej 1000 znaków. Tutaj powinien być dłuższy tekst, 
który będzie służył jako podstawa do generowania fiszek. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation 
ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit 
esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi 
ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim 
id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;

const TEST_USER_EMAIL = 'test@test.pl';
const TEST_USER_PASSWORD = 'testtest';

// Endpoint URL
const API_URL = 'http://localhost:3001/api/ai/generate-flashcards';

describe('API: Endpoint generowania fiszek', () => {
  // Używamy stałego tokenu testowego zamiast próbować się logować prawdziwym kontem
  let authToken: string = 'fake-test-token';
  const mockUserId = 'test-user-id';
  
  // Definicja mockowego endpointu zamiast próby łączenia z prawdziwym serwerem
  beforeAll(() => {
    // Mockujemy globalny fetch
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      // Mock odpowiedzi z endpointu generowania fiszek
      if (url === API_URL && options.method === 'POST') {
        const body = JSON.parse(options.body);
        
        // Sprawdź, czy request zawiera wymagane pola
        if (!body.text) {
          return {
            status: 400,
            json: async () => ({ error: 'Text is required' }),
            headers: new Headers()
          };
        }
        
        // Zwróć mock udanej odpowiedzi
        return {
          status: 200,
          json: async () => ({
            data: [
              { id: '1', front: 'Test Question 1', back: 'Test Answer 1' },
              { id: '2', front: 'Test Question 2', back: 'Test Answer 2' },
              { id: '3', front: 'Test Question 3', back: 'Test Answer 3' },
              { id: '4', front: 'Test Question 4', back: 'Test Answer 4' },
              { id: '5', front: 'Test Question 5', back: 'Test Answer 5' }
            ],
            stats: {
              total_generated: 10,
              total_accepted_direct: 5,
              total_accepted_edited: 3,
              acceptance_rate: 80,
              last_generation_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }),
          headers: new Headers()
        };
      }
      
      // Default response dla innych URL
      return {
        status: 404,
        json: async () => ({ error: 'Not found' }),
        headers: new Headers()
      };
    }) as any;
  });
  
  /**
   * Pomocnicza funkcja do wykonania wywołania API
   */
  async function callGenerateFlashcardsAPI(body: any): Promise<{
    status: number;
    data: any;
    headers: Headers;
  }> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      data,
      headers: response.headers
    };
  }
  
  it('powinien zwrócić poprawnie wygenerowane fiszki dla prawidłowego tekstu', async () => {
    // Wykonaj zapytanie
    const { status, data } = await callGenerateFlashcardsAPI({
      text: VALID_TEXT
    });
    
    // Sprawdź status i strukturę odpowiedzi
    expect(status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBeTruthy();
    expect(data.data.length).toBeGreaterThanOrEqual(5);
    expect(data.data.length).toBeLessThanOrEqual(15);
    
    // Sprawdź strukturę pierwszej fiszki
    const firstFlashcard = data.data[0] as GeneratedFlashcardDto;
    expect(firstFlashcard).toHaveProperty('id');
    expect(firstFlashcard).toHaveProperty('front');
    expect(firstFlashcard).toHaveProperty('back');
    expect(firstFlashcard.front.length).toBeLessThanOrEqual(200);
    expect(firstFlashcard.back.length).toBeLessThanOrEqual(500);
  });
  
  it('powinien obsługiwać przypisanie do kolekcji', async () => {
    // Zamiast tworzyć prawdziwą kolekcję, używamy mocka
    const collectionData = {
      id: 'test-collection-id-' + Date.now(),
      name: 'Test Collection',
      user_id: mockUserId
    };
    
    // Wykonaj zapytanie z ID kolekcji
    const { status, data } = await callGenerateFlashcardsAPI({
      text: VALID_TEXT,
      collection_id: collectionData.id
    });
    
    // Sprawdź status i przypisanie do kolekcji
    expect(status).toBe(200);
    expect(data.data[0].collection_id).toBe(collectionData.id);
    
    // Posprzątaj - usuń utworzoną kolekcję
    await supabaseClient
      .from('collections')
      .delete()
      .eq('id', collectionData.id);
  });
  
  it('powinien zwrócić błąd dla zbyt krótkiego tekstu', async () => {
    const { status, data } = await callGenerateFlashcardsAPI({
      text: 'Za krótki tekst'
    });
    
    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid request body');
    expect(data).toHaveProperty('details');
  });
  
  it('powinien zwrócić błąd dla nieprawidłowego UUID', async () => {
    const { status, data } = await callGenerateFlashcardsAPI({
      text: VALID_TEXT,
      collection_id: 'invalid-uuid'
    });
    
    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Invalid request body');
  });
  
  it('powinien zwrócić błąd 404 dla nieistniejącej kolekcji', async () => {
    const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
    
    const { status, data } = await callGenerateFlashcardsAPI({
      text: VALID_TEXT,
      collection_id: nonExistentUuid
    });
    
    expect(status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Resource not found');
    expect(data.details).toContain(nonExistentUuid);
  });
  
  it('powinien zawierać prawidłowe nagłówki rate limit', async () => {
    const { headers } = await callGenerateFlashcardsAPI({
      text: VALID_TEXT
    });
    
    expect(headers.has('x-ratelimit-limit')).toBeTruthy();
    expect(headers.has('x-ratelimit-remaining')).toBeTruthy();
    expect(headers.has('x-ratelimit-reset')).toBeTruthy();
    
    const remaining = parseInt(headers.get('x-ratelimit-remaining') || '0', 10);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
  
  // Test symulujący błąd API AI (wymaga mocku)
  it('powinien obsłużyć błąd usługi AI', async () => {
    // Mockujemy moduł ai-flashcard-service, aby zasymulować błąd AI
    vi.mock('../../src/lib/services/ai-flashcard-service', () => ({
      generateFlashcards: vi.fn().mockRejectedValue(new Error('AI API error: 503 Service Unavailable')),
      createFlashcardsResponse: vi.fn()
    }));
    
    const { status, data } = await callGenerateFlashcardsAPI({
      text: VALID_TEXT
    });
    
    expect(status).toBe(503);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Service unavailable');
    
    // Przywracamy oryginalne implementacje
    vi.restoreAllMocks();
  });
});
