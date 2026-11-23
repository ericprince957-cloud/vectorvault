import Link from "next/link";
import Image from "next/image";

const scenes = [
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2200&q=85",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85",
];

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
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-3 py-3 text-white sm:px-6 sm:py-6">
      <div aria-hidden="true" className="auth-scenes">
        {scenes.map((scene, index) => (
          <div
            key={scene}
            className={`auth-scene auth-scene-${index + 1}`}
            style={{ backgroundImage: `url("${scene}")` }}
          />
        ))}
        <div className="auth-scene-shade" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-7xl overflow-hidden rounded-[26px] border border-[#C9A227]/30 bg-black/35 shadow-[0_24px_100px_rgba(0,0,0,0.65)] backdrop-blur-[2px] sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative flex min-h-[245px] flex-col justify-between overflow-hidden border-b border-[#C9A227]/20 bg-black/25 p-6 backdrop-blur-[2px] sm:p-10 lg:min-h-full lg:border-b-0 lg:border-r lg:border-r-[#C9A227]/20 lg:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full border border-[#C9A227]/15 shadow-[0_0_100px_rgba(201,162,39,0.08)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full border border-white/10" />
          <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-full border border-white/15 bg-black/20 px-3 py-2 backdrop-blur-xl transition hover:border-[#C9A227]/55 hover:bg-black/35">
            <Image src="/vectorvault-logo.png" alt="VectorVault" width={30} height={30} priority className="h-7 w-7 object-contain" />
            <span className="text-sm font-semibold tracking-wide">VectorVault</span>
          </Link>

          <div className="relative z-10 max-w-xl py-8 lg:py-0">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#E5C76B]">Your code. Your space.</p>
            <h2 className="max-w-lg text-3xl font-semibold leading-[1.08] tracking-tight drop-shadow-lg sm:text-4xl lg:text-5xl">
              Build boldly.
              <span className="mt-1 block text-white/65">Keep everything in flow.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/65 sm:text-base">
              A focused home for your repositories, ideas and the work you are building next.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-white/55">
              <span className="h-px w-10 bg-[#C9A227]/80" />
              Minimalist code hosting by Vector Codes
            </div>
          </div>

          <p className="relative z-10 hidden text-[11px] tracking-wide text-white/40 lg:block">© {new Date().getFullYear()} VectorVault. Built for people who build.</p>
        </section>

        <section className="flex items-center justify-center bg-black/45 px-5 py-10 backdrop-blur-xl sm:px-10 sm:py-14 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-3 h-px w-10 bg-[#C9A227]/80" />
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-white/50">{subtitle}</p>
            </div>
            {children}
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-white/40">
              <Link href="/" className="transition hover:text-[#E5C76B]">← Back to VectorVault</Link>
              <span>Secure access</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
