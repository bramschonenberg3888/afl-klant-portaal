import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';
import { chatModel } from '@/lib/ai';
import { getRAGContext } from '@/lib/ai/rag';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export const maxDuration = 30;

function getTextFromMessage(message: UIMessage): string {
  if (!message.parts) return '';
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join(' ');
}

export async function POST(req: Request) {
  const session = await auth();
  const { messages, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    conversationId?: string;
  };

  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
  if (!lastUserMessage) {
    return new Response('No user message found', { status: 400 });
  }

  // Extract text content from the last user message
  const userContent = getTextFromMessage(lastUserMessage);

  // Get RAG context for the user's question
  const ragContext = await getRAGContext(userContent, {
    topK: 5,
    language: 'nl',
  });

  // Store conversation if user is authenticated
  let activeConversationId = conversationId;
  if (session?.user?.id && !activeConversationId) {
    const conversation = await db.conversation.create({
      data: {
        userId: session.user.id,
        title: userContent.slice(0, 100),
      },
    });
    activeConversationId = conversation.id;
  }

  // Store user message
  if (activeConversationId) {
    await db.message.create({
      data: {
        conversationId: activeConversationId,
        role: 'user',
        content: userContent,
      },
    });
  }

  // Create the stream
  const stream = createUIMessageStream({
    async execute({ writer }) {
      // Add sources as metadata
      if (ragContext.sources.length > 0) {
        for (const source of ragContext.sources) {
          writer.write({
            type: 'source-url',
            sourceId: source,
            url: source,
            title: source,
          });
        }
      }

      // Convert messages to model format
      const modelMessages = await convertToModelMessages(messages);

      // Stream the response
      const result = streamText({
        model: chatModel,
        system: ragContext.systemPrompt,
        messages: modelMessages,
        async onFinish({ text }) {
          // Store assistant message after completion
          if (activeConversationId) {
            await db.message.create({
              data: {
                conversationId: activeConversationId,
                role: 'assistant',
                content: text,
                sources: ragContext.sources.length > 0 ? JSON.stringify(ragContext.sources) : null,
              },
            });

            // Update conversation title if this is the first exchange
            const messageCount = await db.message.count({
              where: { conversationId: activeConversationId },
            });
            if (messageCount <= 2) {
              await db.conversation.update({
                where: { id: activeConversationId },
                data: { title: userContent.slice(0, 100) },
              });
            }
          }
        },
      });

      // Convert to UI message stream
      const uiStream = result.toUIMessageStream();
      for await (const chunk of uiStream) {
        writer.write(chunk);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      'X-Conversation-Id': activeConversationId || '',
    },
  });
}
