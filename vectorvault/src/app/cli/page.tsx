import Link from "next/link";

const commands = [
  ["vector clone prince/portfolio", "Bring a repository to your machine"],
  ["vector init", "Start a new local repository"],
  ["vector status", "See what changed"],
  ["vector add .", "Stage your work"],
  ['vector commit -m "Build something great"', "Save a checkpoint"],
  ["vector push", "Send your commits to VectorVault"],
  ["vector pull", "Get the latest changes"],
];

export default function VectorCliPage() {
  return (
    <main className="min-h-screen bg-[#090909] px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-[#E5C76B]">
          <span aria-hidden="true">←</span> VectorVault
        </Link>

        <section className="grid gap-12 py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#E5C76B]">
              Meet the command line
            </p>
            <h1 className="max-w-xl text-5xl font-semibold tracking-tight sm:text-6xl">
              Your code.
              <span className="block text-[#E5C76B]">Your command.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400">
              Meet Vector CLI — a simple, developer-first way to work with your
              VectorVault repositories. Familiar Git power, with a workflow that
              feels like Vector.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#commands" className="rounded-lg bg-[#C9A227] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B]">
                Explore commands
              </a>
              <a href="https://github.com/ericprince957-cloud/vectorvault/tree/main/vectorvault/vector-cli" target="_blank" rel="noreferrer" className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-[#C9A227]/60">
                View CLI source
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              <span className="ml-2 text-xs text-zinc-500">vector — terminal</span>
            </div>
            <div className="space-y-4 p-6 font-mono text-sm">
              <p className="text-zinc-500"># Start with your repository</p>
              <p><span className="text-[#E5C76B]">$</span> vector clone prince/portfolio</p>
              <p className="text-zinc-500"># Make your changes</p>
              <p><span className="text-[#E5C76B]">$</span> vector add .</p>
              <p><span className="text-[#E5C76B]">$</span> vector commit -m "First build"</p>
              <p><span className="text-[#E5C76B]">$</span> vector push</p>
              <div className="mt-6 rounded-lg border border-[#C9A227]/20 bg-[#C9A227]/5 p-4 text-xs leading-6 text-[#E5C76B]">
                One workflow. Your own developer identity.
              </div>
            </div>
          </div>
        </section>

        <section id="commands" className="border-t border-white/10 py-14">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#E5C76B]">The workflow</p>
            <h2 className="mt-3 text-2xl font-semibold">Small commands. Serious work.</h2>
            <p className="mt-2 text-sm text-zinc-500">The interface we are building for Vector developers.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {commands.map(([command, description]) => (
              <div key={command} className="rounded-xl border border-white/10 bg-[#111111] p-4">
                <code className="break-all text-sm text-[#E5C76B]">{command}</code>
                <p className="mt-2 text-xs text-zinc-500">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#111111] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#E5C76B]">Early preview</p>
          <h2 className="mt-3 text-xl font-semibold">We are building the engine behind the commands.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            The CLI interface is taking shape. Authenticated remote Git hosting,
            including working clone, push and pull against VectorVault, is the next
            engineering milestone. We will clearly mark those capabilities live
            only after they pass end-to-end tests.
          </p>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-6 text-xs text-zinc-600">
          VectorVault · Built by Vector Codes
        </footer>
      </div>
    </main>
  );
}
