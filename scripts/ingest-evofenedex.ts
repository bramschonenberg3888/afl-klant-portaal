import Firecrawl from "@mendable/firecrawl-js";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const embeddingModel = openai.embedding("text-embedding-3-small");

async function main() {
  console.log("Starting Evofenedex crawl...");

  // Crawl all pages under the warehouse regulations section
  const crawlResult = await firecrawl.crawl("https://www.evofenedex.nl/kennis/magazijn/wet-en-regelgeving", {
    limit: 50,
    includePaths: ["/kennis/magazijn/wet-en-regelgeving/*"],
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
    },
  });

  if (!crawlResult.data || crawlResult.data.length === 0) {
    console.error("Crawl returned no data:", crawlResult);
    return;
  }

  console.log(`Crawled ${crawlResult.data.length} pages`);

  for (const page of crawlResult.data || []) {
    if (!page.markdown) {
      console.log(`Skipping ${page.metadata?.sourceURL} - no content`);
      continue;
    }

    const sourceUrl = page.metadata?.sourceURL || "unknown";
    const title = page.metadata?.title || sourceUrl;

    console.log(`Processing: ${title}`);

    // Check if already exists
    const existing = await prisma.document.findFirst({
      where: { sourceUrl },
    });

    if (existing) {
      console.log(`  Already exists, skipping`);
      continue;
    }

    // Create document
    const doc = MDocument.fromMarkdown(page.markdown);
    const chunks = await doc.chunk({
      strategy: "markdown",
      maxSize: 512,
      overlap: 50,
    });

    console.log(`  Created ${chunks.length} chunks`);

    // Store document
    const document = await prisma.document.create({
      data: {
        title,
        content: page.markdown,
        sourceUrl,
      },
    });

    // Create chunks and generate embeddings
    const chunkTexts = chunks.map((c) => c.text);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunkTexts,
    });

    console.log(`  Generated ${embeddings.length} embeddings`);

    // Store chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunkRecord = await prisma.documentChunk.create({
        data: {
          documentId: document.id,
          content: chunks[i].text,
          chunkIndex: i,
        },
      });

      // Store embedding using raw SQL
      const vectorLiteral = `[${embeddings[i].join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
        vectorLiteral,
        chunkRecord.id
      );
    }

    console.log(`  Saved to database`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
