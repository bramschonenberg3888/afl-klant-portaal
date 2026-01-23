'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, ExternalLink } from 'lucide-react';
import { useState, useCallback, type ComponentProps } from 'react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  isLoading?: boolean;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
    </div>
  );
}

function CodeBlock({
  className,
  children,
  ...props
}: ComponentProps<'code'>) {
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
    <div className="relative group my-2">
      {language && (
        <span className="absolute top-2 left-3 text-xs text-muted-foreground font-mono">
          {language}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-1.5 right-1.5 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
        title={copied ? 'Gekopieerd!' : 'Kopieer code'}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <pre className={cn('bg-muted rounded-md p-4 pt-8 overflow-x-auto', language && 'pt-8')}>
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

function SourceLink({ url }: { url: string }) {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    hostname = url;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded transition-colors"
    >
      <ExternalLink className="h-3 w-3" />
      <span className="truncate max-w-[150px]">{hostname}</span>
    </a>
  );
}

export function Message({ role, content, sources, isLoading }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 p-4 group', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'bg-primary' : 'bg-muted')}>
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col gap-2 max-w-[80%] min-w-0', isUser ? 'items-end' : 'items-start')}>
        <div className="relative">
          <div
            className={cn(
              'rounded-lg px-4 py-2',
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {isLoading ? (
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
          {!isUser && !isLoading && content && (
            <div className="absolute -right-8 top-1">
              <CopyButton content={content} />
            </div>
          )}
        </div>

        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sources.map((source, index) => (
              <SourceLink key={index} url={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
