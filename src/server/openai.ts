const defaultOpenAIRecipeAutofillModel = "gpt-5-nano";

type OpenAIMessage = {
  role: "system" | "user";
  content: string;
};

type OpenAITextOutput = {
  type?: string;
  text?: unknown;
};

type OpenAIOutputItem = {
  content?: OpenAITextOutput[];
};

type OpenAIResponse = {
  status?: unknown;
  incomplete_details?: {
    reason?: unknown;
  } | null;
  output_text?: unknown;
  output?: OpenAIOutputItem[];
};

export type OpenAIJsonResult = {
  value: unknown;
  model: string;
  rawLength: number;
  parseSucceeded: true;
};

const recipeAutofillSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "description", "ingredients"],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity", "unit"],
        properties: {
          name: { type: "string" },
          quantity: { type: ["number", "null"] },
          unit: { type: ["string", "null"] },
        },
      },
    },
  },
};

function logDevelopment(label: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info(label, details);
  }
}

function getOpenAIRecipeAutofillModel() {
  return process.env.OPENAI_MODEL?.trim() || defaultOpenAIRecipeAutofillModel;
}

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      isTimeout:
        error.name === "TimeoutError" ||
        error.name === "AbortError" ||
        error.message.toLowerCase().includes("timeout"),
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
    isTimeout: false,
  };
}

function getResponseText(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as OpenAIResponse;

  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }

      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return null;
}

export async function callOpenAIRecipeAutofillJson(
  messages: OpenAIMessage[],
): Promise<OpenAIJsonResult> {
  return callOpenAIJson({
    messages,
    maxOutputTokens: 1200,
    schema: recipeAutofillSchema,
    schemaName: "mesamate_recipe_autofill",
    logPrefix: "AI AUTOFILL",
  });
}

async function callOpenAIJson({
  messages,
  maxOutputTokens,
  schema,
  schemaName,
  logPrefix,
}: {
  messages: OpenAIMessage[];
  maxOutputTokens: number;
  schema: Record<string, unknown>;
  schemaName: string;
  logPrefix: string;
}): Promise<OpenAIJsonResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const model = getOpenAIRecipeAutofillModel();
  const requestPayload = {
    model,
    input: messages,
    max_output_tokens: maxOutputTokens,
    reasoning: {
      effort: "minimal",
    },
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  };

  logDevelopment(`${logPrefix} REQUEST`, {
    event: "request_started",
    provider: "openai",
    model,
    messages,
    requestPayload,
  });

  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    const errorDetails = getErrorDetails(error);

    logDevelopment(`${logPrefix} ERROR`, {
      provider: "openai",
      model,
      ...errorDetails,
      reason: errorDetails.isTimeout
        ? "OpenAI request aborted or timed out"
        : "OpenAI request failed before an HTTP response was received",
    });

    throw error;
  }

  const responseText = await response.text();

  logDevelopment(`${logPrefix} RESPONSE`, {
    provider: "openai",
    model,
    httpStatus: response.status,
    rawApiResponseTextLength: responseText.length,
    rawApiResponseTextStart: responseText.slice(0, 1000),
  });

  if (!response.ok) {
    logDevelopment(`${logPrefix} ERROR`, {
      provider: "openai",
      model,
      httpStatus: response.status,
      message: "OpenAI returned a non-2xx response",
      rawApiResponseTextLength: responseText.length,
      rawApiResponseTextStart: responseText.slice(0, 1000),
    });
    throw new Error(`OpenAI ${model} failed`);
  }

  let data: unknown;

  try {
    data = JSON.parse(responseText) as OpenAIResponse;
  } catch (error) {
    const errorDetails = getErrorDetails(error);

    logDevelopment(`${logPrefix} JSON PARSE RESULT`, {
      provider: "openai",
      model,
      parseSucceeded: false,
      error: "OpenAI API response was not JSON",
      ...errorDetails,
      rawApiResponseTextLength: responseText.length,
      rawApiResponseTextStart: responseText.slice(0, 1000),
    });
    throw error;
  }

  const openAIResponse = data as OpenAIResponse;

  logDevelopment(`${logPrefix} RESPONSE DETAILS`, {
    provider: "openai",
    model,
    status: openAIResponse.status,
    incompleteDetails: openAIResponse.incomplete_details,
    outputLength: openAIResponse.output?.length ?? 0,
  });

  if (
    openAIResponse.status === "incomplete" &&
    openAIResponse.incomplete_details?.reason === "max_output_tokens"
  ) {
    logDevelopment(`${logPrefix} ERROR`, {
      provider: "openai",
      model,
      httpStatus: response.status,
      status: openAIResponse.status,
      incompleteReason: openAIResponse.incomplete_details.reason,
      message: "OpenAI response was incomplete because max_output_tokens was reached",
    });
  }

  const content = getResponseText(data);

  if (!content) {
    logDevelopment(`${logPrefix} ERROR`, {
      provider: "openai",
      model,
      httpStatus: response.status,
      message: "OpenAI response did not contain output_text",
      rawApiResponseTextLength: responseText.length,
      rawApiResponseTextStart: responseText.slice(0, 1000),
    });
    throw new Error("OpenAI returned no output text");
  }

  logDevelopment(`${logPrefix} RESPONSE`, {
    provider: "openai",
    model,
    httpStatus: response.status,
    parsedOutputText: content,
    rawApiResponseTextLength: responseText.length,
    parsedOutputTextLength: content.length,
  });

  try {
    const value = JSON.parse(content) as unknown;

    logDevelopment(`${logPrefix} JSON PARSE RESULT`, {
      provider: "openai",
      model,
      rawLength: content.length,
      parseSucceeded: true,
    });

    return {
      value,
      model,
      rawLength: content.length,
      parseSucceeded: true,
    };
  } catch (error) {
    const errorDetails = getErrorDetails(error);

    logDevelopment(`${logPrefix} JSON PARSE RESULT`, {
      provider: "openai",
      model,
      rawLength: content.length,
      parseSucceeded: false,
      ...errorDetails,
    });
    throw error;
  }
}
