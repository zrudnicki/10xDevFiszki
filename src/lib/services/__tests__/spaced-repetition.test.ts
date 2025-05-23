import { describe, expect, it } from 'vitest';
import { calculateNextReview, getNextReviewDescription } from '../spaced-repetition.service';

describe('Spaced Repetition Service', () => {
  describe('calculateNextReview', () => {
    it('should reduce interval to 1 day for poor quality (0-2)', () => {
      // Test with quality = 2 (difficult)
      const result = calculateNextReview({
        quality: 2,
        currentEasinessFactor: 2.5,
        currentIntervalDays: 10,
        reviewsCount: 5
      });
      
      expect(result.intervalDays).toBe(1);
      expect(result.easinessFactor).toBeLessThan(2.5); // Should decrease EF
      expect(result.reviewsCount).toBe(6);
      
      // Next review date should be tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.nextReviewDate.getDate()).toBe(tomorrow.getDate());
    });
    
    it('should set interval to 1 day for first successful review', () => {
      const result = calculateNextReview({
        quality: 5, // Perfect recall
        currentEasinessFactor: 2.5,
        currentIntervalDays: 0,
        reviewsCount: 0
      });
      
      expect(result.intervalDays).toBe(1);
      expect(result.reviewsCount).toBe(1);
      expect(result.easinessFactor).toBeGreaterThan(2.5); // Should increase EF for good recall
    });
    
    it('should set interval to 6 days for second successful review', () => {
      const result = calculateNextReview({
        quality: 4, // Good recall
        currentEasinessFactor: 2.6,
        currentIntervalDays: 1,
        reviewsCount: 1
      });
      
      expect(result.intervalDays).toBe(6);
      expect(result.reviewsCount).toBe(2);
    });
    
    it('should multiply interval by EF for subsequent reviews', () => {
      const initialEF = 2.5;
      const initialInterval = 6;
      
      const result = calculateNextReview({
        quality: 5, // Perfect recall
        currentEasinessFactor: initialEF,
        currentIntervalDays: initialInterval,
        reviewsCount: 2
      });
      
      // Expected interval = previous interval * EF (rounded)
      const expectedInterval = Math.round(initialInterval * result.easinessFactor);
      expect(result.intervalDays).toBe(expectedInterval);
      expect(result.reviewsCount).toBe(3);
    });
    
    it('should cap intervals at 365 days', () => {
      const result = calculateNextReview({
        quality: 5,
        currentEasinessFactor: 2.5,
        currentIntervalDays: 300,
        reviewsCount: 10
      });
      
      expect(result.intervalDays).toBe(365); // Should be capped
    });
    
    it('should maintain easiness factor within bounds (1.3 minimum)', () => {
      // Test with very poor quality to push EF down
      const result = calculateNextReview({
        quality: 0,
        currentEasinessFactor: 1.5,
        currentIntervalDays: 10,
        reviewsCount: 5
      });
      
      expect(result.easinessFactor).toBe(1.3); // Should not go below 1.3
    });
    
    it('should properly calculate EF based on quality', () => {
      // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      
      // For q=5, EF should increase by 0.1
      const perfectResult = calculateNextReview({
        quality: 5,
        currentEasinessFactor: 2.5,
        currentIntervalDays: 10,
        reviewsCount: 5
      });
      
      expect(perfectResult.easinessFactor).toBeCloseTo(2.6, 1);
      
      // For q=3, EF should decrease slightly
      const okResult = calculateNextReview({
        quality: 3,
        currentEasinessFactor: 2.5,
        currentIntervalDays: 10,
        reviewsCount: 5
      });
      
      expect(okResult.easinessFactor).toBeLessThan(2.5);
    });
  });
  
  describe('getNextReviewDescription', () => {
    it('should return "Dziś" for today', () => {
      const today = new Date();
      expect(getNextReviewDescription(today)).toBe('Dziś');
    });
    
    it('should return "Jutro" for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getNextReviewDescription(tomorrow)).toBe('Jutro');
    });
    
    it('should return "Za X dni" for dates within a week', () => {
      const fiveDays = new Date();
      fiveDays.setDate(fiveDays.getDate() + 5);
      expect(getNextReviewDescription(fiveDays)).toBe('Za 5 dni');
    });
    
    it('should return week-based description for dates within a month', () => {
      const twoWeeks = new Date();
      twoWeeks.setDate(twoWeeks.getDate() + 14);
      expect(getNextReviewDescription(twoWeeks)).toBe('Za 2 tygodnie');
    });
    
    it('should return month-based description for dates within a year', () => {
      const threeMonths = new Date();
      threeMonths.setMonth(threeMonths.getMonth() + 3);
      expect(getNextReviewDescription(threeMonths)).toBe('Za 3 miesiące');
    });
    
    it('should return year-based description for dates beyond a year', () => {
      const twoYears = new Date();
      twoYears.setFullYear(twoYears.getFullYear() + 2);
      expect(getNextReviewDescription(twoYears)).toBe('Za 2 lata');
    });
  });
}); 