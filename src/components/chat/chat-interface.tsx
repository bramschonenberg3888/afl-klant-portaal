'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport, type SourceUrlUIPart, type TextUIPart } from 'ai';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from './message';
import { RelatedQuestions, SUGGESTED_QUESTIONS } from './related-questions';
import { Send, Square, MessageSquare, ArrowDown, RefreshCw } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);

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
  });

  const isLoading = chat.status === 'streaming' || chat.status === 'submitted';

  const scrollToBottom = useCallback((updateState = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      if (updateState) {
        setIsAtBottom(true);
      }
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive (if already at bottom)
  const messagesLength = chat.messages.length;
  useEffect(() => {
    if (isAtBottom) {
      // Use requestAnimationFrame to scroll after render without triggering setState
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messagesLength, isAtBottom]);

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
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

  const getMessageSources = (message: UIMessage): string[] => {
    if (!message.parts) return [];
    return message.parts
      .filter((part): part is SourceUrlUIPart => part.type === 'source-url')
      .map((part) => part.url);
  };

  return (
    <Card className="flex flex-col h-[600px] max-h-[80vh]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Veiligheidsassistent
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full"
          onScrollCapture={handleScroll}
        >
          <div ref={scrollRef}>
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
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        {!isAtBottom && chat.messages.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-4 shadow-lg"
            onClick={() => scrollToBottom()}
          >
            <ArrowDown className="h-4 w-4 mr-1" />
            Nieuw
          </Button>
        )}
      </CardContent>

      <CardFooter className="border-t p-4 flex-col gap-2">
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

        <form onSubmit={onSubmit} className="flex gap-2 w-full items-end">
          <TextareaAutosize
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel uw vraag... (Enter om te versturen, Shift+Enter voor nieuwe regel)"
            disabled={isLoading}
            minRows={1}
            maxRows={5}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => chat.stop()}
              className="shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!inputValue.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </CardFooter>
    </Card>
  );
}
