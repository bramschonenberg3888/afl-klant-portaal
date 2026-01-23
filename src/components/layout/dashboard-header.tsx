'use client';

import Image from 'next/image';

export function DashboardHeader() {
  return (
    <header className="flex h-20 shrink-0 items-center justify-end bg-[#0052CC] px-8">
      <Image
        src="/logo.png"
        alt="Logistiekconcurrent"
        width={200}
        height={72}
        className="h-14 w-auto"
        priority
      />
    </header>
  );
}
