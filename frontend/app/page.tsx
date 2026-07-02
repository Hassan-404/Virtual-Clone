import Twin from '@/components/twin';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-8">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-500 mb-3">
              Mr.X
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Talk with Hassan Murtaza
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              An AI-powered digital twin built on real experience in generative AI,
              RAG, computer vision, and production ML systems.
            </p>
          </header>

          <div className="h-[min(72vh,680px)]">
            <Twin />
          </div>
        </div>
      </div>
    </main>
  );
}
