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
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/vectorvault-logo.png"
            alt="VectorVault logo"
            width={48}
            height={48}
            priority
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141414] p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="transition hover:text-white">
            ← Back to VectorVault
          </Link>
        </p>
      </div>
    </main>
  );
}
