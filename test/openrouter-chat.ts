import { config } from "dotenv";

// Load environment variables
config();

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  id: string;
  choices: Array<{
    message: Message;
    finish_reason: string;
  }>;
  model: string;
};

async function askOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro-preview-03-25",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices[0]?.message.content ?? "No response";
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error calling OpenRouter:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    const response = await askOpenRouter("What is the meaning of life?");
    // eslint-disable-next-line no-console
    console.log("Response:", response);
  } catch {
    process.exit(1);
  }
}

void main();