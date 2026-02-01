export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <span className="text-lg font-bold">AFL Groep | Logistiekconcurrent</span>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
