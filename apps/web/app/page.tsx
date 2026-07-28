export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-cta text-sm uppercase tracking-[0.2em]">Product Intelligence Platform</p>
      <h1 className="text-foreground text-4xl font-semibold leading-tight md:text-5xl">
        Repository baseline is online
      </h1>
      <p className="text-foreground/80 max-w-xl text-lg leading-relaxed">
        Phase 0 tooling placeholder. Authentication, organizations, and product workflows arrive in
        later tasks. Health check:{" "}
        <a className="text-ai-accent underline underline-offset-4" href="/api/health">
          /api/health
        </a>
        .
      </p>
    </main>
  );
}
