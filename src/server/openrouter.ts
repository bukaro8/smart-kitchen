const openRouterModels = [
  "qwen/qwen3-32b:free",

  "openai/gpt-oss-120b:free",

  "qwen/qwen3-next-80b-a3b-instruct:free",

  "openrouter/free",
];

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

type OpenRouterChoice = {
  message?: {
    content?: unknown;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

export type OpenRouterJsonResult = {
  value: unknown;
  model: string;
  rawLength: number;
  parseSucceeded: true;
};

export class OpenRouterRateLimitError extends Error {
  constructor() {
    super("All OpenRouter models were rate limited");
    this.name = "OpenRouterRateLimitError";
  }
}

function getBalancedJsonCandidate(content: string, start: number) {
  let depth = 0;
  let isInString = false;
  let isEscaped = false;

  for (let index = start; index < content.length; index += 1) {
    const character = content[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (character === "\\") {
      isEscaped = true;
      continue;
    }

    if (character === '"') {
      isInString = !isInString;
      continue;
    }

    if (isInString) {
      continue;
    }

    if (character === "{") {
      depth += 1;
    }

    if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return content.slice(start, index + 1);
      }
    }
  }

  return null;
}

function getJsonCandidates(content: string) {
  const trimmed = content.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const searchText = fencedJson?.[1] ?? trimmed;
  const candidates: string[] = [];

  for (let index = 0; index < searchText.length; index += 1) {
    if (searchText[index] !== "{") {
      continue;
    }

    const candidate = getBalancedJsonCandidate(searchText, index);

    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function parseFirstJsonObject(content: string) {
  for (const candidate of getJsonCandidates(content)) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      continue;
    }
  }

  return JSON.parse(content.trim()) as unknown;
}

function getContentFromOpenRouterResponse(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (content && typeof content === "object") {
    return JSON.stringify(content);
  }

  return null;
}

function logDevelopment(label: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(label, details);
  }
}

export async function callOpenRouterJson(
  messages: OpenRouterMessage[],
): Promise<OpenRouterJsonResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  let lastError: unknown;
  let sawRateLimit = false;

  for (const model of openRouterModels) {
    try {
      const requestPayload = {
        model,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      };

      logDevelopment("AI AUTOFILL REQUEST", {
        model,
        messages,
        requestPayload,
      });

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.AUTH_URL ?? "http://localhost:3000",
            "X-Title": "MesaMate",
          },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(15000),
        },
      );
      const responseText = await response.text();

      if (!response.ok) {
        logDevelopment("AI AUTOFILL RESPONSE", {
          model,
          httpStatus: response.status,
          rateLimited: response.status === 429,
          rawAssistantResponseText: null,
          rawApiResponseTextLength: responseText.length,
          rawApiResponseTextStart: responseText.slice(0, 500),
        });

        if (response.status === 429) {
          sawRateLimit = true;
          lastError = new OpenRouterRateLimitError();
          continue;
        }

        lastError = new Error(`OpenRouter ${model} failed`);
        continue;
      }

      let data: unknown;

      try {
        data = JSON.parse(responseText) as OpenRouterResponse;
      } catch (error) {
        lastError = error;
        logDevelopment("AI AUTOFILL RESPONSE", {
          model,
          httpStatus: response.status,
          rawAssistantResponseText: null,
          rawApiResponseTextLength: responseText.length,
          rawApiResponseTextStart: responseText.slice(0, 500),
        });
        logDevelopment("AI JSON PARSE RESULT", {
          model,
          parseSucceeded: false,
          error: "OpenRouter API response was not JSON",
        });
        continue;
      }

      const content = getContentFromOpenRouterResponse(data);

      if (!content) {
        logDevelopment("AI AUTOFILL RESPONSE", {
          model,
          httpStatus: response.status,
          rawAssistantResponseText: null,
          rawApiResponseTextLength: responseText.length,
        });
        lastError = new Error(`OpenRouter ${model} returned no content`);
        continue;
      }

      logDevelopment("AI AUTOFILL RESPONSE", {
        model,
        httpStatus: response.status,
        rawAssistantResponseText: content,
        rawApiResponseTextLength: responseText.length,
      });

      try {
        const rawLength = content.length;
        const value = parseFirstJsonObject(content);

        logDevelopment("AI JSON PARSE RESULT", {
          model,
          rawLength,
          parseSucceeded: true,
        });

        return {
          value,
          model,
          rawLength,
          parseSucceeded: true,
        };
      } catch (error) {
        lastError = error;
        logDevelopment("AI JSON PARSE RESULT", {
          model,
          rawLength: content.length,
          parseSucceeded: false,
          error: error instanceof Error ? error.message : "JSON parse failed",
        });
        continue;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (sawRateLimit && lastError instanceof OpenRouterRateLimitError) {
    throw lastError;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("OpenRouter request failed");
}
