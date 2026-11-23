import Link from "next/link";
import Image from "next/image";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#070707] px-3 py-3 text-white sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[26px] border border-[#C9A227]/25 bg-[#0b0b0b] shadow-[0_24px_100px_rgba(0,0,0,0.55)] sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative flex min-h-[245px] flex-col justify-between overflow-hidden border-b border-[#C9A227]/15 bg-[radial-gradient(ellipse_at_18%_15%,rgba(201,162,39,0.12),transparent_38%),linear-gradient(145deg,#101010_0%,#090909_58%,#0d0b07_100%)] p-6 sm:p-10 lg:min-h-full lg:border-b-0 lg:border-r lg:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full border border-[#C9A227]/10 shadow-[0_0_100px_rgba(201,162,39,0.05)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full border border-[#C9A227]/10" />
          <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-black/20 px-3 py-2 transition hover:border-[#C9A227]/40">
            <Image src="/vectorvault-logo.png" alt="VectorVault" width={30} height={30} priority className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold tracking-wide">VectorVault</span>
          </Link>

          <div className="relative z-10 max-w-xl py-8 lg:py-0">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#C9A227]">Your code. Your space.</p>
            <h2 className="max-w-lg text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
              Build boldly.
              <span className="mt-1 block text-zinc-400">Keep everything in flow.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-zinc-400 sm:text-base">
              A focused home for your repositories, ideas and the work you are building next.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-zinc-500">
              <span className="h-px w-10 bg-[#C9A227]/60" />
              Minimalist code hosting by Vector Codes
            </div>
          </div>

          <p className="relative z-10 hidden text-[11px] tracking-wide text-zinc-600 lg:block">© {new Date().getFullYear()} VectorVault. Built for people who build.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-3 h-px w-10 bg-[#C9A227]/70" />
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
            </div>
            {children}
            <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-5 text-[11px] text-zinc-600">
              <Link href="/" className="transition hover:text-zinc-300">← Back to VectorVault</Link>
              <span>Secure access</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
