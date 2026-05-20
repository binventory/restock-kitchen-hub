import { Link } from "@tanstack/react-router";
import { LegalFooter } from "@/components/layout/LegalFooter";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)]">
      <header className="border-b bg-[var(--bg-elevated)] px-4 py-3">
        <Link to="/" className="text-lg font-bold text-primary">Restock</Link>
      </header>
      <main className="flex-1 mx-auto max-w-3xl w-full p-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="mt-4 prose prose-sm dark:prose-invert text-sm leading-relaxed text-muted-foreground space-y-3">
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}
