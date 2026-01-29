import { ChatLayout } from '@/components/chat/chat-layout';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;

  return <ChatLayout initialConversationId={params.id} />;
}
