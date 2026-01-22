import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@/env";

export const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const chatModel = openai("gpt-4o-mini");
export const embeddingModel = openai.embedding("text-embedding-3-small");
