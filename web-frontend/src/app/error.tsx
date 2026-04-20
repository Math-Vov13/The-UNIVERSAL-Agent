'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Aurora from '@/components/AuroraBackground';
import GradientText from '@/components/GradientText';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col relative min-h-screen">
      <div className="absolute inset-0 w-full h-full z-0">
        <Aurora blend={0.2} amplitude={0.5} speed={0.2} />
      </div>

      <section className="relative z-10 flex flex-col items-center justify-center h-screen gap-6 text-center px-4">
        <p className="text-sm font-mono text-red-400 tracking-widest uppercase">Error 500</p>

        <GradientText className="text-8xl font-bold !mx-0">
          Something broke.
        </GradientText>

        <p className="text-gray-400 text-lg max-w-md">
          An unexpected error occurred on our end. You can try again or go back home.
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-gray-600">ID: {error.digest}</p>
        )}

        <div className="flex gap-4 mt-4">
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="div"
            className="bg-black text-white"
          >
            <button onClick={reset} className="px-6 py-3 text-base font-semibold">
              Try again
            </button>
          </HoverBorderGradient>

          <HoverBorderGradient
            containerClassName="rounded-full"
            as="div"
            className="bg-black text-white"
          >
            <Link href="/" className="px-6 py-3 text-base font-semibold">
              Go home
            </Link>
          </HoverBorderGradient>
        </div>
      </section>
    </main>
  );
}
