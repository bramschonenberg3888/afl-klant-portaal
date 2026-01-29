import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      {/* Left side - Brand panel */}
      <div className="hidden w-1/2 flex-col items-start justify-between bg-[#0052CC] p-12 text-white lg:flex">
        <Image
          src="/logo-lc.svg"
          alt="Logistiekconcurrent"
          width={189}
          height={64}
          className="h-16 w-auto"
          priority
        />
        <div className="space-y-6">
          <h1 className="text-5xl font-bold leading-tight">
            Magazijn op Maat
            <br />
            Klantportaal
          </h1>
          <p className="text-xl text-white/80">
            Alles over een efficiënt en veilig magazijn op één plek
          </p>
        </div>
        <p className="text-sm text-white/60">
          &copy; {new Date().getFullYear()} Logistiekconcurrent. Alle rechten voorbehouden.
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex w-full items-center justify-center bg-white p-6 lg:w-1/2">
        {children}
      </div>
    </div>
  );
}
