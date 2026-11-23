import Image from "next/image";
import Link from "next/link";

const sampleRepos = [
  { name: "vector-ui", description: "A clean component library for modern web apps.", language: "TypeScript", color: "bg-blue-400", visibility: "Public", updated: "Updated 2 hours ago" },
  { name: "campus-connect", description: "Helping students find and build communities.", language: "JavaScript", color: "bg-yellow-400", visibility: "Public", updated: "Updated yesterday" },
  { name: "my-first-api", description: "A simple REST API built while learning backend development.", language: "Python", color: "bg-green-400", visibility: "Private", updated: "Updated 3 days ago" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080808]/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image src="/vectorvault-logo.png" alt="VectorVault" width={34} height={34} priority className="h-8 w-8 object-contain" />
            <span className="text-[17px] font-semibold tracking-tight">VectorVault</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-zinc-400 md:flex">
            <Link href="/explore" className="transition hover:text-white">Explore</Link>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#about" className="transition hover:text-white">About</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link href="/login" className="px-2 py-2 text-[13px] text-zinc-300 transition hover:text-white">Sign in</Link>
            <Link href="/signup" className="rounded-md border border-white/20 bg-white/[0.06] px-3.5 py-2 text-[13px] font-medium text-white transition hover:border-[#D4AF37]/60 hover:bg-white/10">Sign up</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-20 pt-20 sm:px-8 md:pb-28 md:pt-28 lg:grid-cols-[1fr_0.95fr] lg:gap-16 lg:px-14">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] text-zinc-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            A home for the next generation of builders
          </div>
          <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-6xl">
            Where developers
            <br />
            <span className="text-white/55">build what’s next.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-7 text-zinc-400 sm:text-base">
            Host code, manage repositories and share your work. Everything you need to keep building, in one focused workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-md border border-[#D4AF37]/65 bg-[#C9A227]/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-[#C9A227]/20">
              Create your account <span aria-hidden="true">→</span>
            </Link>
            <Link href="/explore" className="rounded-md border border-white/15 bg-black/25 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.06]">
              Explore repositories
            </Link>
          </div>
          <p className="mt-5 text-xs text-zinc-500">Free to get started · Built for developers everywhere</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl bg-[#C9A227]/[0.06] blur-3xl" />
          <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#090909]/85 shadow-[0_30px_100px_rgba(0,0,0,.6)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current"><path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h3A1.5 1.5 0 0 1 8 2.5v3A1.5 1.5 0 0 1 6.5 7h-3A1.5 1.5 0 0 1 2 5.5zm6 8A1.5 1.5 0 0 1 9.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 8 13.5zM2 10.5A1.5 1.5 0 0 1 3.5 9h3A1.5 1.5 0 0 1 8 10.5v3A1.5 1.5 0 0 1 6.5 15h-3A1.5 1.5 0 0 1 2 13.5zM8 2.5A1.5 1.5 0 0 1 9.5 1h3A1.5 1.5 0 0 1 14 2.5v3A1.5 1.5 0 0 1 12.5 7h-3A1.5 1.5 0 0 1 8 5.5z"/></svg>
                Your workspace
              </div>
              <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-500">Preview</span>
            </div>
            <div className="grid grid-cols-[112px_1fr] sm:grid-cols-[150px_1fr]">
              <aside className="border-r border-white/10 bg-white/[0.02] p-3 sm:p-4">
                <p className="mb-4 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">Workspace</p>
                <div className="space-y-1 text-xs">
                  <div className="rounded-md border border-[#D4AF37]/20 bg-[#C9A227]/[0.08] px-2 py-2 text-zinc-100">Overview</div>
                  <div className="px-2 py-2 text-zinc-500">Repositories</div>
                  <div className="px-2 py-2 text-zinc-500">Your profile</div>
                </div>
                <div className="mt-8 border-t border-white/10 pt-4">
                  <p className="px-2 text-[10px] text-zinc-600">YOUR ACCOUNT</p>
                  <div className="mt-3 flex items-center gap-2 px-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#C9A227]/10 text-[10px] text-[#E5C76B]">VV</div>
                    <span className="hidden truncate text-[11px] text-zinc-400 sm:block">Developer</span>
                  </div>
                </div>
              </aside>
              <div className="min-w-0 p-3 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">Repositories</h2>
                    <p className="mt-1 text-[10px] text-zinc-500">Your projects, all in one place.</p>
                  </div>
                  <span className="rounded-md border border-[#D4AF37]/45 px-2 py-1.5 text-[10px] text-[#E5C76B]">+ New</span>
                </div>
                <div className="mb-3 flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-zinc-600">
                  <span>⌕</span> Find a repository...
                </div>
                <div className="space-y-2">
                  {sampleRepos.map((repo) => (
                    <div key={repo.name} className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#E5C76B]">{repo.name}</span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-zinc-500">{repo.visibility}</span>
                      </div>
                      <p className="mt-1.5 text-[10px] leading-5 text-zinc-500">{repo.description}</p>
                      <div className="mt-2 flex items-center gap-2 text-[9px] text-zinc-500"><span className={`h-2 w-2 rounded-full ${repo.color}`} />{repo.language}<span className="ml-auto">{repo.updated}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-3 md:gap-10 lg:px-14">
          <div><div className="mb-3 text-xs text-[#D4AF37]">01</div><h3 className="text-sm font-semibold">Host your code</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Keep your projects and files organised in repositories.</p></div>
          <div><div className="mb-3 text-xs text-[#D4AF37]">02</div><h3 className="text-sm font-semibold">Build your profile</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Give your work a home and let people discover what you build.</p></div>
          <div><div className="mb-3 text-xs text-[#D4AF37]">03</div><h3 className="text-sm font-semibold">Share your work</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Showcase public projects with a simple developer profile.</p></div>
        </div>
      </section>

      <footer id="about" className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-8 text-xs text-zinc-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-14">
        <div className="flex items-center gap-2"><Image src="/vectorvault-logo.png" alt="" width={22} height={22} className="h-5 w-5 object-contain" /><span>VectorVault · Built by Vector Codes</span></div>
        <div className="flex flex-wrap gap-x-6 gap-y-2"><Link href="/explore" className="hover:text-white">Explore</Link><Link href="/login" className="hover:text-white">Sign in</Link><a href="https://github.com/ericprince957-cloud/vectorvault" className="hover:text-white">GitHub</a><a href="mailto:vectorcodes15@gmail.com" className="hover:text-white">Contact</a></div>
      </footer>
    </main>
  );
}
