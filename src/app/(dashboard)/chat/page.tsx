import { ChatLayout } from '@/components/chat/chat-layout';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="-my-4 md:-my-6 lg:-my-8 h-[calc(100dvh-6rem)]">
      <ChatLayout initialConversationId={params.id} />
    </div>
  );
}
