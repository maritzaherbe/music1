import Creator from "@/components/Creator";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8 sm:py-14">
      <header className="mb-8 text-center animate-fade-in">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400">
          Own Song
        </p>
        <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
          Become the artist of<br className="hidden sm:block" /> your own song
        </h1>
        <p className="mx-auto mt-3 max-w-md text-balance text-sm text-slate-500 sm:text-base">
          Tell us who it&apos;s for and one little story. We&apos;ll turn it into a real,
          produced song in about a minute.
        </p>
      </header>

      <Creator />

      <footer className="mt-auto pt-10 text-center text-xs text-slate-400">
        Songs are your own creation — we never imitate real artists.
      </footer>
    </main>
  );
}
