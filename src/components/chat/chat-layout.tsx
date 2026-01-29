'use client';

import { useState } from 'react';
import { ChatInterface } from './chat-interface';
import { ConversationList } from './conversation-list';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

interface ChatLayoutProps {
  initialConversationId?: string;
}

export function ChatLayout({ initialConversationId }: ChatLayoutProps) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleSelect = (id: string) => {
    setConversationId(id);
    setMobileSidebarOpen(false);
  };

  const handleNewChat = () => {
    setConversationId(undefined);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-9rem)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-72 shrink-0 h-full">
        <ConversationList
          activeId={conversationId}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Gesprekken</SheetTitle>
          <ConversationList
            activeId={conversationId}
            onSelect={handleSelect}
            onNewChat={handleNewChat}
          />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0">
        <ChatInterface
          key={conversationId || 'new'}
          conversationId={conversationId}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
