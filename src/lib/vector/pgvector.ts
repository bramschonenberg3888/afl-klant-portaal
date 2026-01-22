import { db } from "@/lib/db";

export interface SimilarChunk {
  id: string;
  content: string;
  documentId: string;
  documentTitle: string;
  sourceUrl: string | null;
  similarity: number;
}

export async function findSimilarChunks(embedding: number[], topK: number = 5): Promise<SimilarChunk[]> {
  // Format embedding as PostgreSQL vector literal
  const vectorLiteral = `[${embedding.join(",")}]`;

  // Use raw SQL for pgvector similarity search
  // Cosine similarity: 1 - (embedding <=> query_embedding)
  const results = await db.$queryRawUnsafe<
    {
      id: string;
      content: string;
      document_id: string;
      document_title: string;
      source_url: string | null;
      similarity: number;
    }[]
  >(
    `
    SELECT
      dc.id,
      dc.content,
      dc."documentId" as document_id,
      d.title as document_title,
      d."sourceUrl" as source_url,
      1 - (dc.embedding <=> $1::vector) as similarity
    FROM "DocumentChunk" dc
    JOIN "Document" d ON dc."documentId" = d.id
    WHERE dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> $1::vector
    LIMIT $2
    `,
    vectorLiteral,
    topK
  );

  return results.map((row) => ({
    id: row.id,
    content: row.content,
    documentId: row.document_id,
    documentTitle: row.document_title,
    sourceUrl: row.source_url,
    similarity: row.similarity,
  }));
}

export async function storeChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const vectorLiteral = `[${embedding.join(",")}]`;

  await db.$executeRawUnsafe(
    `
    UPDATE "DocumentChunk"
    SET embedding = $1::vector
    WHERE id = $2
    `,
    vectorLiteral,
    chunkId
  );
}

export async function ensurePgvectorExtension(): Promise<void> {
  await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);
}
