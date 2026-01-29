import { embed } from 'ai';
import { embeddingModel } from './index';
import { findSimilarChunks, type SimilarChunk } from '@/lib/vector/pgvector';
import { buildRAGPrompt, buildNoResultsPrompt } from './prompts';
import { withRetry } from '@/lib/utils';

export interface RAGContext {
  systemPrompt: string;
  chunks: SimilarChunk[];
  sources: string[];
}

export async function getRAGContext(
  query: string,
  options: {
    topK?: number;
    language?: 'nl' | 'en';
    minSimilarity?: number;
  } = {}
): Promise<RAGContext> {
  const { topK = 5, language = 'nl', minSimilarity = 0.3 } = options;

  // Generate embedding for the query with retry for cold-start failures
  const { embedding } = await withRetry(() =>
    embed({
      model: embeddingModel,
      value: query,
    })
  );

  // Find similar chunks using pgvector with minimum similarity threshold
  const chunks = await findSimilarChunks(embedding, topK, minSimilarity);

  // Handle zero-result case
  if (chunks.length === 0) {
    return {
      systemPrompt: buildNoResultsPrompt(language),
      chunks: [],
      sources: [],
    };
  }

  // Build context from chunks
  const contextParts = chunks.map((chunk, index) => {
    const sourceLabel = chunk.sourceUrl
      ? `[Bron: ${chunk.sourceUrl}]`
      : `[Document: ${chunk.documentTitle}]`;
    return `${index + 1}. ${sourceLabel}\n${chunk.content}`;
  });

  const context = contextParts.join('\n\n');
  const systemPrompt = buildRAGPrompt(context, language);

  // Extract unique source URLs
  const sources = [...new Set(chunks.map((c) => c.sourceUrl).filter(Boolean))] as string[];

  return {
    systemPrompt,
    chunks,
    sources,
  };
}

export function formatSourcesForMessage(sources: string[]): string | null {
  if (sources.length === 0) return null;
  return JSON.stringify(sources);
}
