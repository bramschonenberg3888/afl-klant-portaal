'use client';

import Image from 'next/image';

export function DashboardHeader() {
  return (
    <header className="flex h-20 shrink-0 items-center justify-end bg-[#0052CC] px-8">
      <Image
        src="/logo-lc.svg"
        alt="Logistiekconcurrent"
        width={189}
        height={64}
        className="h-16 w-auto"
        priority
      />
    </header>
  );
}
