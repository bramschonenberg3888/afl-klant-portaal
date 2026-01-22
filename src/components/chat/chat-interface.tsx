"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport, type SourceUrlUIPart, type TextUIPart } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "./message";
import { RelatedQuestions, SUGGESTED_QUESTIONS } from "./related-questions";
import { Send, Loader2, MessageSquare } from "lucide-react";

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId },
      }),
    [conversationId]
  );

  const chat = useChat({
    id: conversationId || "default-chat",
    transport,
  });

  const isLoading = chat.status === "streaming" || chat.status === "submitted";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat.messages]);

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue("");
    await chat.sendMessage({ text });
  };

  const getMessageContent = (message: UIMessage): string => {
    if (!message.parts) return "";
    return message.parts
      .filter((part): part is TextUIPart => part.type === "text")
      .map((part) => part.text)
      .join("");
  };

  const getMessageSources = (message: UIMessage): string[] => {
    if (!message.parts) return [];
    return message.parts
      .filter((part): part is SourceUrlUIPart => part.type === "source-url")
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

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full">
          {chat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Welkom bij de Veiligheidsassistent</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Stel een vraag over magazijnveiligheid of arbeidsomstandigheden.
              </p>
              <RelatedQuestions questions={SUGGESTED_QUESTIONS} onSelect={handleSuggestedQuestion} />
            </div>
          ) : (
            <div className="flex flex-col">
              {chat.messages.map((message) => (
                <Message
                  key={message.id}
                  role={message.role as "user" | "assistant"}
                  content={getMessageContent(message)}
                  sources={message.role === "assistant" ? getMessageSources(message) : undefined}
                />
              ))}
              {isLoading && <Message role="assistant" content="" isLoading />}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-4">
        <form onSubmit={onSubmit} className="flex gap-2 w-full">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Stel uw vraag..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
