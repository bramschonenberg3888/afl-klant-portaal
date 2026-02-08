import { embed } from 'ai';
import { embeddingModel } from './index';
import { findSimilarChunks, type SimilarChunk } from '@/lib/vector/pgvector';
import { buildRAGPrompt, buildNoResultsPrompt } from './prompts';
import { withRetry } from '@/lib/utils';

export interface RAGSource {
  url: string;
  title: string;
  snippet: string;
}

export interface RAGContext {
  systemPrompt: string;
  chunks: SimilarChunk[];
  sources: RAGSource[];
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

  // Retrieval observability — metadata only, no content (privacy)
  if (chunks.length > 0) {
    const similarities = chunks.map((c) => c.similarity);
    console.log('[RAG retrieval]', {
      queryLength: query.length,
      chunksFound: chunks.length,
      similarity: {
        min: Math.min(...similarities).toFixed(3),
        max: Math.max(...similarities).toFixed(3),
        avg: (similarities.reduce((a, b) => a + b, 0) / similarities.length).toFixed(3),
      },
    });
  } else {
    console.log('[RAG retrieval]', { queryLength: query.length, chunksFound: 0 });
  }

  // Handle zero-result case
  if (chunks.length === 0) {
    return {
      systemPrompt: buildNoResultsPrompt(language),
      chunks: [],
      sources: [],
    };
  }

  // Build context from chunks — numbered for citation, like chat-man's [1], [2] pattern
  const contextParts = chunks.map((chunk, index) => {
    const sourceLabel = chunk.sourceUrl
      ? `Bron: ${chunk.sourceUrl}`
      : `Document: ${chunk.documentTitle}`;
    return `[${index + 1}] (${sourceLabel})\n${chunk.content}`;
  });

  const context = contextParts.join('\n\n');
  const systemPrompt = buildRAGPrompt(context, language);

  // Build rich sources with snippets, deduplicated by URL
  const seenUrls = new Set<string>();
  const sources: RAGSource[] = [];
  for (const chunk of chunks) {
    const url = chunk.sourceUrl ?? chunk.documentTitle;
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    sources.push({
      url: chunk.sourceUrl ?? '',
      title: chunk.documentTitle,
      snippet: chunk.snippet,
    });
  }

  return {
    systemPrompt,
    chunks,
    sources,
  };
}

export function formatSourcesForMessage(sources: RAGSource[]): string | null {
  if (sources.length === 0) return null;
  return JSON.stringify(sources);
}
