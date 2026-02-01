'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport, type SourceUrlUIPart, type TextUIPart } from 'ai';
import { useRef, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Message, type SourceInfo } from './message';
import { RelatedQuestions, SUGGESTED_QUESTIONS } from './related-questions';
import { Send, Square, MessageSquare, ArrowDown, RefreshCw, Menu } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { trpc } from '@/trpc/client';

interface ChatInterfaceProps {
  conversationId?: string;
  onOpenSidebar?: () => void;
}

export function ChatInterface({ conversationId, onOpenSidebar }: ChatInterfaceProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom();

  // Load existing conversation messages
  const { data: conversationData } = trpc.chat.getConversation.useQuery(
    { id: conversationId! },
    { enabled: !!conversationId }
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: { conversationId },
      }),
    [conversationId]
  );

  const chat = useChat({
    id: conversationId || 'default-chat',
    transport,
    experimental_throttle: 50,
    onError: (error) => {
      toast.error('Er is een fout opgetreden', {
        description: error.message || 'Probeer het opnieuw.',
      });
    },
  });

  // Push loaded DB messages into the chat once fetched
  const dbMessages = conversationData?.messages;
  useEffect(() => {
    if (!dbMessages || dbMessages.length === 0) return;
    chat.setMessages(
      dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: msg.content }],
      }))
    );
    // Only run when DB data arrives, not on every chat reference change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbMessages]);

  const isLoading = chat.status === 'streaming' || chat.status === 'submitted';

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSuggestedQuestion = async (question: string) => {
    if (isLoading) return;
    setInputValue('');
    await chat.sendMessage({ text: question });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && isLoading) {
      chat.stop();
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue('');
    await chat.sendMessage({ text });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  const handleRegenerate = async () => {
    if (isLoading || chat.messages.length === 0) return;
    await chat.regenerate();
  };

  const canRegenerate =
    !isLoading &&
    chat.messages.length > 0 &&
    chat.messages[chat.messages.length - 1]?.role === 'assistant';

  const getMessageContent = (message: UIMessage): string => {
    if (!message.parts) return '';
    return message.parts
      .filter((part): part is TextUIPart => part.type === 'text')
      .map((part) => part.text)
      .join('');
  };

  const getMessageSources = (message: UIMessage): SourceInfo[] => {
    if (!message.parts) return [];
    return message.parts
      .filter((part): part is SourceUrlUIPart => part.type === 'source-url')
      .map((part) => ({
        url: part.url,
        title: (part as SourceUrlUIPart & { title?: string }).title || '',
      }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {onOpenSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={onOpenSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <MessageSquare className="h-5 w-5 shrink-0" />
        <h2 className="font-semibold">Veiligheidsassistent</h2>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div ref={containerRef} className="h-full overflow-y-auto">
          {chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[400px]">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Welkom bij de Veiligheidsassistent</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Stel een vraag over magazijnveiligheid of arbeidsomstandigheden.
              </p>
              <RelatedQuestions
                questions={SUGGESTED_QUESTIONS}
                onSelect={handleSuggestedQuestion}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              {chat.messages.map((message) => (
                <Message
                  key={message.id}
                  role={message.role as 'user' | 'assistant'}
                  content={getMessageContent(message)}
                  sources={message.role === 'assistant' ? getMessageSources(message) : undefined}
                />
              ))}
              {isLoading && <Message role="assistant" content="" isLoading />}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {!isAtBottom && chat.messages.length > 0 && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-4 rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border-t p-4 flex flex-col gap-2">
        {/* Regenerate button */}
        {canRegenerate && (
          <Button
            variant="ghost"
            size="sm"
            className="self-center text-muted-foreground"
            onClick={handleRegenerate}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Antwoord opnieuw genereren
          </Button>
        )}

        <form onSubmit={onSubmit} className="w-full">
          <div className="flex items-end rounded-xl border border-input bg-background shadow-sm overflow-hidden">
            <TextareaAutosize
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Stel uw vraag... (Enter om te versturen, Shift+Enter voor nieuwe regel)"
              disabled={isLoading}
              minRows={1}
              maxRows={5}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isLoading ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => chat.stop()}
                className="shrink-0 m-1.5"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim()}
                className="shrink-0 m-1.5"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
