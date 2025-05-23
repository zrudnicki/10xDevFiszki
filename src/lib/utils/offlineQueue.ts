/**
 * System kolejkowania żądań offline.
 * Pozwala na zapisywanie żądań, które nie mogły zostać wykonane z powodu braku połączenia,
 * a następnie ich wykonanie, gdy połączenie zostanie przywrócone.
 */

import type { FlashcardReviewStatus } from '@/types';

/**
 * Queue item representing a pending API request
 */
interface QueueItem {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Review queue item specifically for flashcard reviews
 */
interface ReviewQueueItem {
  flashcardId: string;
  status: FlashcardReviewStatus;
  timestamp: number;
}

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'fiszki_offline_request_queue',
  REVIEWS_QUEUE: 'fiszki_offline_reviews_queue'
};

// Maximum number of retry attempts for failed requests
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Utilities for queuing API requests when offline and processing them when back online
 */

// Storage key for offline queue
const OFFLINE_QUEUE_KEY = 'fiszki_offline_queue';

// Types for the queue
interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
  retries: number;
}

/**
 * Add a request to the offline queue
 * @param url API endpoint
 * @param method HTTP method
 * @param body Request body
 * @returns The queued request ID
 */
export const addToOfflineQueue = (url: string, method: string, body: any): string => {
  try {
    const queue = getQueue();
    const id = crypto.randomUUID();
    
    const request: QueuedRequest = {
      id,
      url,
      method,
      body,
      timestamp: Date.now(),
      retries: 0
    };
    
    queue.push(request);
    saveQueue(queue);
    
    console.log(`[Offline Queue] Request added: ${method} ${url}`);
    return id;
  } catch (error) {
    console.error('[Offline Queue] Error adding request to queue:', error);
    throw error;
  }
};

/**
 * Process all requests in the offline queue
 * @returns {Promise<{success: number, failed: number}>} Results of processing
 */
export const processOfflineQueue = async (): Promise<{success: number, failed: number}> => {
  if (!navigator.onLine) {
    console.log('[Offline Queue] Still offline, skipping queue processing');
    return { success: 0, failed: 0 };
  }
  
  const queue = getQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  console.log(`[Offline Queue] Processing ${queue.length} queued requests`);
  
  const results = {
    success: 0,
    failed: 0
  };
  
  const updatedQueue: QueuedRequest[] = [];
  
  for (const request of queue) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request.body)
      });
      
      if (response.ok) {
        console.log(`[Offline Queue] Successfully processed: ${request.method} ${request.url}`);
        results.success++;
      } else {
        console.warn(`[Offline Queue] Failed to process: ${request.method} ${request.url}`, 
          await response.text());
        
        // If max retries not reached, keep in queue
        if (request.retries < 3) {
          request.retries++;
          updatedQueue.push(request);
          results.failed++;
        } else {
          console.error(`[Offline Queue] Max retries reached for: ${request.method} ${request.url}`);
          results.failed++;
        }
      }
    } catch (error) {
      console.error(`[Offline Queue] Error processing: ${request.method} ${request.url}`, error);
      
      // If max retries not reached, keep in queue
      if (request.retries < 3) {
        request.retries++;
        updatedQueue.push(request);
      }
      
      results.failed++;
    }
  }
  
  saveQueue(updatedQueue);
  return results;
};

/**
 * Check if there are requests in the offline queue
 * @returns {boolean} True if there are queued requests
 */
export const hasQueuedRequests = (): boolean => {
  return getQueue().length > 0;
};

/**
 * Get the current offline queue
 * @returns {QueuedRequest[]} The queue
 */
function getQueue(): QueuedRequest[] {
  try {
    const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('[Offline Queue] Error reading queue from localStorage:', error);
    return [];
  }
}

/**
 * Save the queue to localStorage
 * @param {QueuedRequest[]} queue The queue to save
 */
function saveQueue(queue: QueuedRequest[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[Offline Queue] Error saving queue to localStorage:', error);
  }
}

/**
 * Add a flashcard review to the offline queue
 * 
 * @param flashcardId ID of the flashcard
 * @param status Review status
 */
export function addReviewToQueue(flashcardId: string, status: FlashcardReviewStatus): void {
  try {
    // Create a new review queue item
    const newItem: ReviewQueueItem = {
      flashcardId,
      status,
      timestamp: Date.now()
    };
    
    // Add to the queue for tracking
    const queue = getReviewQueue();
    
    // Check if a review for this flashcard already exists
    const existingIndex = queue.findIndex(item => item.flashcardId === flashcardId);
    if (existingIndex !== -1) {
      // Update the existing review
      queue[existingIndex] = newItem;
    } else {
      // Add new review
      queue.push(newItem);
    }
    
    // Save updated queue
    localStorage.setItem(STORAGE_KEYS.REVIEWS_QUEUE, JSON.stringify(queue));
    
    // Also add to general request queue
    addToOfflineQueue(
      `/api/flashcards/${flashcardId}/review`,
      'POST',
      { status }
    );
  } catch (error) {
    console.error('Failed to add review to queue:', error);
  }
}

/**
 * Get the current review queue
 */
export function getReviewQueue(): ReviewQueueItem[] {
  try {
    const queueJson = localStorage.getItem(STORAGE_KEYS.REVIEWS_QUEUE);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Failed to get review queue:', error);
    return [];
  }
}

/**
 * Remove processed reviews from the queue
 * 
 * @param flashcardIds Array of flashcard IDs to remove
 */
export function removeFromReviewQueue(flashcardIds: string[]): void {
  try {
    if (flashcardIds.length === 0) return;
    
    const queue = getReviewQueue();
    const updatedQueue = queue.filter(item => !flashcardIds.includes(item.flashcardId));
    
    localStorage.setItem(STORAGE_KEYS.REVIEWS_QUEUE, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Failed to remove reviews from queue:', error);
  }
} 