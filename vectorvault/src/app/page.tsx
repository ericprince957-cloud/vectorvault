import Image from "next/image";

const repositories = [
  {
    name: "portfolio-website",
    description: "My personal developer portfolio.",
    language: "TypeScript",
    color: "bg-blue-400",
    stars: 12,
    updated: "2 hours ago",
  },
  {
    name: "ecommerce-store",
    description: "A modern online shopping experience.",
    language: "JavaScript",
    color: "bg-yellow-400",
    stars: 8,
    updated: "Yesterday",
  },
  {
    name: "student-management",
    description: "A simple student management system.",
    language: "Python",
    color: "bg-green-400",
    stars: 5,
    updated: "3 days ago",
  },
];

const features = [
  {
    number: "01",
    title: "Host your projects",
    description:
      "Create repositories and keep your project files organised in one place.",
  },
  {
    number: "02",
    title: "Build your profile",
    description:
      "Showcase your skills, projects, and experience through your developer profile.",
  },
  {
    number: "03",
    title: "Share your work",
    description:
      "Make your public projects accessible to other developers and potential clients.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#090909] text-white">

      {/* Navigation */}
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-16">
        <a href="/" className="flex items-center gap-3">
          <Image
            src="/vectorvault-logo.png"
            alt="VectorVault logo"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />

          <span className="text-xl font-semibold tracking-tight">
            VectorVault
          </span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>

          <a href="#about" className="transition hover:text-white">
            About
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="hidden text-sm text-zinc-300 transition hover:text-white sm:block"
          >
            Sign in
          </a>

          <a
            href="/signup"
            className="rounded-lg bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#E5C76B]"
          >
            Get started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pb-20 pt-28 text-center md:px-16 md:pt-36">
        <div className="mx-auto mb-8 w-fit rounded-full border border-[#C9A227]/30 bg-[#C9A227]/5 px-4 py-2 text-xs text-[#E5C76B]">
          Built for developers. Made for Africa.
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          Your code deserves
          <br />
          <span className="text-[#E5C76B]">a better home.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
          A simple place to host your projects, showcase your work,
          and connect with the developer community.
          Built with African developers in mind.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="/signup"
            className="rounded-lg bg-[#C9A227] px-7 py-3.5 font-semibold text-black transition hover:bg-[#E5C76B]"
          >
            Create your account →
          </a>

          <a
            href="#features"
            className="rounded-lg border border-white/15 px-7 py-3.5 font-medium text-white transition hover:border-white/40"
          >
            Explore features
          </a>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Minimalist code hosting for Nigerian developers.
        </p>
      </section>

      {/* Repository Preview */}
      <section className="px-5 pb-24 md:px-16">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-2xl shadow-black">

          {/* Window Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>

            <span className="text-xs text-zinc-500">
              vectorvault / dashboard
            </span>

            <span className="text-xs text-[#E5C76B]">
              Preview
            </span>
          </div>

          {/* Dashboard Layout */}
          <div className="grid md:grid-cols-[220px_1fr]">

            {/* Sidebar */}
            <aside className="border-b border-white/10 p-5 md:border-b-0 md:border-r">
              <div className="mb-7 text-sm font-semibold">
                Workspace
              </div>

              <div className="space-y-5 text-sm text-zinc-400">
                <div className="flex items-center gap-3 text-white">
                  <span>⌂</span>
                  Overview
                </div>

                <div className="flex items-center gap-3">
                  <span>▤</span>
                  Repositories
                </div>

                <div className="flex items-center gap-3">
                  <span>◎</span>
                  Your Profile
                </div>

                <div className="flex items-center gap-3">
                  <span>⚙</span>
                  Settings
                </div>
              </div>

              <div className="mt-10 border-t border-white/10 pt-5">
                <p className="mb-4 text-xs text-zinc-600">
                  YOUR ACCOUNT
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A227]/20 text-sm font-bold text-[#E5C76B]">
                    PE
                  </div>

                  <div>
                    <p className="text-xs font-medium text-white">
                      Prince Eric
                    </p>

                    <p className="text-xs text-zinc-500">
                      @princeeric
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Dashboard */}
            <div className="p-5 md:p-8">

              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Your repositories
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Manage and showcase your projects.
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-semibold text-black"
                >
                  + New repository
                </button>
              </div>

              {/* Search Preview */}
              <div className="mb-5">
                <input
                  type="text"
                  placeholder="Find a repository..."
                  disabled
                  className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm text-zinc-400 outline-none"
                />
              </div>

              {/* Repository Cards */}
              <div className="space-y-3">
                {repositories.map((repo) => (
                  <div
                    key={repo.name}
                    className="rounded-xl border border-white/10 bg-[#151515] p-4 transition hover:border-[#C9A227]/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-[#E5C76B]">
                            {repo.name}
                          </span>

                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                            Public
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-zinc-500">
                          {repo.description}
                        </p>
                      </div>

                      <span className="text-xs text-zinc-500">
                        ☆ {repo.stars}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${repo.color}`} />
                        {repo.language}
                      </span>

                      <span>Updated {repo.updated}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-center text-xs text-zinc-600">
                A glimpse of what's possible with VectorVault.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="border-t border-white/10 px-6 py-24 md:px-16"
      >
        <div className="mx-auto max-w-6xl">

          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-medium text-[#E5C76B]">
              WHAT YOU GET
            </p>

            <h2 className="text-3xl font-bold md:text-4xl">
              Everything starts with your code.
            </h2>

            <p className="mt-4 text-zinc-400">
              The tools you need to organise and showcase your projects.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.number}
                className="rounded-xl border border-white/10 bg-[#141414] p-7 transition hover:border-[#C9A227]/40"
              >
                <span className="text-sm text-[#C9A227]">
                  {feature.number}
                </span>

                <h3 className="mt-7 text-xl font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="border-t border-white/10 px-6 py-20 text-center md:px-16"
      >
        <h2 className="text-2xl font-bold">
          Created with developers in mind.
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400">
          VectorVault is a project by Vector Codes, created to make
          sharing and showcasing code projects more accessible
          to developers in Nigeria and beyond.
        </p>

        <p className="mt-10 text-xs text-zinc-600">
          © 2026 VectorVault. Built by Vector Codes.
        </p>
      </section>

    </main>
  );
}