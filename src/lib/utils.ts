import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function defaultIsRetriable(error: unknown): boolean {
  // Bail immediately on auth / client errors that won't resolve on retry
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (/\b(401|403|404|422)\b/.test(msg)) return false;
    if (msg.includes('unauthorized') || msg.includes('forbidden')) return false;
  }
  // Check for HTTP response status on fetch-style errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status >= 400 && status < 500) return false;
  }
  return true;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500,
  isRetriable: (_error: unknown) => boolean = defaultIsRetriable
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts || !isRetriable(error)) throw error;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Retry exhausted');
}
