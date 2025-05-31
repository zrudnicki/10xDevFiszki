import type { FlashcardCandidate } from "../types";

interface OpenRouterMessage {
  role: "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens: number;
  temperature: number;
}

interface OpenRouterChoice {
  message: {
    content: string;
  };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
}

/**
 * OpenRouter AI Client for flashcard generation
 * Integrates with OPENROUTER.ai API for AI-powered flashcard creation
 */
export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://openrouter.ai/api/v1";
  private readonly timeout = 30000; // 30 seconds timeout

  constructor() {
    this.apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is required");
    }
  }

  /**
   * Generate flashcards from text using OpenRouter AI
   */
  async generateFlashcards(params: {
    text: string;
    maxCards: number;
    context?: {
      collection_name?: string;
      collection_description?: string;
    };
  }): Promise<FlashcardCandidate[]> {
    const { text, maxCards, context } = params;

    const prompt = this.buildPrompt(text, maxCards, context);

    try {
      const response = await this.makeRequest({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      return this.parseAIResponse(response);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("OpenRouter API error:", error);
      throw new Error("Failed to generate flashcards with AI");
    }
  }

  /**
   * Build the prompt for AI flashcard generation
   */
  private buildPrompt(
    text: string,
    maxCards: number,
    context?: {
      collection_name?: string;
      collection_description?: string;
    }
  ): string {
    let prompt = `Create ${maxCards} flashcards from this text. `;

    if (context?.collection_name) {
      prompt += `Collection: "${context.collection_name}". `;
    }

    prompt += `

Instructions:
- Make exactly ${maxCards} flashcards
- Front: short question (max 100 chars)
- Back: clear answer (max 300 chars)
- Confidence: number between 0.0 and 1.0

Output format (JSON only):
[
  {"front": "What is JavaScript?", "back": "Programming language for web development", "confidence": 0.9}
]

Text:
${text}

JSON output:`;

    return prompt;
  }

  /**
   * Make HTTP request to OpenRouter API
   */
  private async makeRequest(payload: OpenRouterRequest): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10xdevfiszki.com",
          "X-Title": "10xDevFiszki",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as OpenRouterResponse;
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("OpenRouter API request timeout");
      }

      throw error;
    }
  }

  /**
   * Parse AI response and extract flashcard candidates
   */
  private parseAIResponse(response: OpenRouterResponse): FlashcardCandidate[] {
    try {
      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in AI response");
      }

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in AI response");
      }

      const candidates = JSON.parse(jsonMatch[0]) as FlashcardCandidate[];

      // Validate and sanitize candidates
      return candidates
        .filter((candidate) => candidate.front && candidate.back && typeof candidate.confidence === "number")
        .map((candidate) => ({
          front: candidate.front.trim().substring(0, 200), // Limit length
          back: candidate.back.trim().substring(0, 500), // Limit length
          confidence: Math.max(0, Math.min(1, candidate.confidence)), // Clamp 0-1
        }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse AI response:", error);
      throw new Error("Failed to parse AI-generated flashcards");
    }
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient();
