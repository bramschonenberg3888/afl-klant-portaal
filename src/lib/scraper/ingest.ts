import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { embeddingModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { storeChunkEmbedding, ensurePgvectorExtension } from "@/lib/vector/pgvector";
import { scrapeUrl, type ScrapeResult } from "./firecrawl";

export interface IngestResult {
  documentId: string;
  title: string;
  sourceUrl: string;
  chunksCreated: number;
  embeddingsGenerated: number;
}

export async function ingestUrl(url: string): Promise<IngestResult> {
  // Ensure pgvector extension exists
  await ensurePgvectorExtension();

  // Scrape the URL
  const scrapeResult = await scrapeUrl(url);

  return await ingestContent(scrapeResult);
}

export async function ingestContent(content: ScrapeResult): Promise<IngestResult> {
  // Create MDocument from markdown
  const doc = MDocument.fromMarkdown(content.markdown);

  // Chunk the document
  const chunks = await doc.chunk({
    strategy: "markdown",
    maxSize: 512,
    overlap: 50,
  });

  // Create the document record
  const document = await db.document.create({
    data: {
      title: content.title,
      content: content.content,
      sourceUrl: content.sourceUrl,
    },
  });

  // Create chunk records
  const chunkRecords = await Promise.all(
    chunks.map((chunk, index) =>
      db.documentChunk.create({
        data: {
          documentId: document.id,
          content: chunk.text,
          chunkIndex: index,
        },
      })
    )
  );

  // Generate embeddings in batches
  const batchSize = 100;
  let embeddingsGenerated = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchRecords = chunkRecords.slice(i, i + batchSize);

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch.map((chunk) => chunk.text),
    });

    // Store embeddings
    await Promise.all(embeddings.map((embedding, idx) => storeChunkEmbedding(batchRecords[idx].id, embedding)));

    embeddingsGenerated += embeddings.length;
  }

  return {
    documentId: document.id,
    title: content.title,
    sourceUrl: content.sourceUrl,
    chunksCreated: chunkRecords.length,
    embeddingsGenerated,
  };
}

export async function ingestMultipleUrls(urls: string[]): Promise<IngestResult[]> {
  const results: IngestResult[] = [];

  for (const url of urls) {
    try {
      const result = await ingestUrl(url);
      results.push(result);
    } catch (error) {
      console.error(`Failed to ingest ${url}:`, error);
    }
  }

  return results;
}

export async function reprocessDocument(documentId: string): Promise<IngestResult> {
  const document = await db.document.findUniqueOrThrow({
    where: { id: documentId },
  });

  // Delete existing chunks
  await db.documentChunk.deleteMany({
    where: { documentId },
  });

  // Re-ingest the content
  return await ingestContent({
    title: document.title,
    content: document.content,
    markdown: document.content,
    sourceUrl: document.sourceUrl || "",
  });
}
