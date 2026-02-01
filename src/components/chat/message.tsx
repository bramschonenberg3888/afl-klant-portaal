'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { useState, useCallback, useEffect, type ComponentProps } from 'react';

export interface SourceInfo {
  url: string;
  title: string;
}

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceInfo[];
  isLoading?: boolean;
  isError?: boolean;
}

function ThinkingIndicator() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
        <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
        <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
      </div>
      {elapsed >= 1 && (
        <span
          className={cn(
            'text-xs tabular-nums',
            elapsed >= 60 ? 'text-amber-500' : 'text-muted-foreground'
          )}
        >
          {elapsed}s
        </span>
      )}
    </div>
  );
}

function ErrorIndicator() {
  return (
    <div className="flex items-center gap-2 py-1 text-destructive">
      <AlertCircle className="h-4 w-4" />
      <span className="text-sm">Er is een fout opgetreden. Probeer het opnieuw.</span>
    </div>
  );
}

function CodeBlock({ className, children, ...props }: ComponentProps<'code'>) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isInline = !className;

  const handleCopy = useCallback(async () => {
    const code = String(children).replace(/\n$/, '');
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  if (isInline) {
    return (
      <code className={cn('bg-muted px-1.5 py-0.5 rounded text-sm', className)} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="my-2 rounded-md border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 border-b">
        <span className="text-xs text-muted-foreground font-mono">{language || 'code'}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleCopy}
          title={copied ? 'Gekopieerd!' : 'Kopieer code'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <pre className="bg-muted p-4 overflow-x-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
      title={copied ? 'Gekopieerd!' : 'Kopieer bericht'}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function SourceCitation({ source, index }: { source: SourceInfo; index: number }) {
  let hostname = '';
  try {
    hostname = new URL(source.url).hostname.replace('www.', '');
  } catch {
    hostname = source.url;
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded-md transition-colors"
    >
      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
        {index + 1}
      </span>
      <span className="flex flex-col min-w-0">
        {source.title && <span className="truncate max-w-[180px] font-medium">{source.title}</span>}
        <span className="truncate max-w-[180px] text-muted-foreground">{hostname}</span>
      </span>
      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
    </a>
  );
}

export function Message({ role, content, sources, isLoading, isError }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 p-4 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'bg-primary' : 'bg-muted')}>
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex flex-col gap-0.5 max-w-[80%] min-w-0',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          {isError ? (
            <ErrorIndicator />
          ) : isLoading ? (
            <ThinkingIndicator />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Copy button for assistant messages */}
        {!isUser && !isLoading && !isError && content && (
          <div className="flex items-center gap-1 mt-0.5">
            <CopyButton content={content} />
          </div>
        )}

        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sources.map((source, index) => (
              <SourceCitation key={source.url} source={source} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
