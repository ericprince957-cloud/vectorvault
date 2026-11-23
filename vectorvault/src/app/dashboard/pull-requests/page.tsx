import Link from "next/link";

export default function PullRequestsPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#D4AF37]">Workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Pull requests</h1><p className="mt-2 text-sm text-zinc-400">Review changes and collaborate before code is merged.</p></div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-500">Coming soon</span>
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-10 text-center backdrop-blur-xl sm:p-16">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#C9A227]/[0.08] text-2xl text-[#E5C76B]">⑂</div>
        <h2 className="mt-5 text-lg font-semibold">Better collaboration starts here.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">Pull requests will give contributors a place to propose changes, review code and discuss updates before they become part of a project.</p>
        <Link href="/dashboard/repositories" className="mt-6 inline-flex rounded-lg border border-white/15 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-[#D4AF37]/50 hover:text-white">Browse repositories <span className="ml-2">→</span></Link>
      </div>
    </section>
  );
}
