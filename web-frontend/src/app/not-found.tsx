import Link from 'next/link';
import Aurora from '@/components/AuroraBackground';
import GradientText from '@/components/GradientText';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col relative min-h-screen">
      <div className="absolute inset-0 w-full h-full z-0">
        <Aurora blend={0.2} amplitude={0.5} speed={0.2} />
      </div>

      <section className="relative z-10 flex flex-col items-center justify-center h-screen gap-6 text-center px-4">
        <p className="text-sm font-mono text-pink-400 tracking-widest uppercase">Error 404</p>

        <GradientText className="text-8xl font-bold !mx-0">
          Page not found.
        </GradientText>

        <p className="text-gray-400 text-lg max-w-md">
          This page doesn&apos;t exist or has been moved. Head back and continue chatting.
        </p>

        <HoverBorderGradient
          containerClassName="rounded-full mt-4"
          as="div"
          className="bg-black text-white"
        >
          <Link href="/" className="px-6 py-3 text-base font-semibold">
            Go home
          </Link>
        </HoverBorderGradient>
      </section>
    </main>
  );
}
