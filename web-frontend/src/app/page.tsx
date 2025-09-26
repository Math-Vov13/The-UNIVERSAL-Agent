import GradientText from '@/components/GradientText';
import RotatingText from '@/components/RotatingText';
import Aurora from '@/components/AuroraBackground';
import Link from 'next/link';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { LayoutTextFlip } from '@/components/ui/layout-text-flip';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col relative min-h-screen">
      <div className="absolute inset-0 w-full h-full z-0">
        <Aurora
          //colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.3}
          amplitude={0.7}
          speed={0.3}
        />
      </div>
      <section className="h-full w-full relative z-10">
        <div className="flex flex-col justify-center h-screen pl-8 items-start max-w-3xl">
          <GradientText className="text-8xl font-bold text-left !mx-0 !justify-start leading-tight"><span>Your new</span> <span className="text-gradient">AI Assistant</span> is here.</GradientText>
          <div className="flex items-center space-x-4 mt-8">
            <h1 className="text-3xl font-bold">{"> "} Ask him about</h1>
            <ContainerTextFlip
              interval={2000}
              textClassName='text-pink-200 text-4xl font-bold'
              className='px-2 sm:px-2 md:px-3 bg-gradient-to-r from-pink-500 to-yellow-500 overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg shadow-[inset_0_-1px_rgba(255,148,180,0.3),inset_0_0_0_1px_rgba(58,41,255,0.4),_0_4px_8px_rgba(255,50,50,0.5)]'
              words={['weather', 'code', 'advices', 'movies', 'books', 'music', 'games', 'travel', 'food', 'science', 'history', 'art', 'technology']}
            />
          </div>
        </div>
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 w-96 bg-gray-800/70 p-6 rounded-lg shadow-lg backdrop-blur-md">
          <div className="bg-gray-900 p-6 rounded-lg shadow-md">
            <p className="text-lg font-semibold text-blue-300">User:</p>
            <p className="text-gray-300">Hello, can you help me with a coding problem?</p>
            <p className="mt-4 text-lg font-semibold text-green-300">AI Assistant:</p>
            <p className="text-gray-300">Of course! Please describe the issue you&apos;re facing, and I&apos;ll do my best to assist you.</p>
            <p className="mt-4 text-lg font-semibold text-blue-300">User:</p>
            <p className="text-gray-300">I&apos;m trying to understand how to use React hooks effectively. Can you explain?</p>
            <p className="mt-4 text-lg font-semibold text-green-300">AI Assistant:</p>
            <p className="text-gray-300">
              Certainly! React hooks are functions that let you use state and other React features in functional components. For example, the `useState` hook allows you to add state to your component. Would you like a code example?
            </p>
          </div>
        </div>

        {/* <div className="absolute bottom-1/4 pl-22 transform translate-y-1/2 mt-8">
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            className='bg-black text-white items-center space-x-2'
          >
            <Link href="/chat" className='px-6 py-3 text-lg font-semibold'>
              Get Started
            </Link>
          </HoverBorderGradient>
        </div> */}

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 grid grid-cols-3 gap-4">
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            className='bg-black text-white items-center space-x-2'
          >
            <Link href="/chat" className='px-6 py-3 text-lg font-semibold'>
              Get Started
            </Link>
          </HoverBorderGradient>
          <div className="flex justify-center mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <HoverBorderGradient
            containerClassName="rounded-full"
            as="button"
            className='bg-black text-white items-center space-x-2'
          >
            <Link href="/about" className="px-6 py-3 text-lg font-semibold">
              Learn More
            </Link>
          </HoverBorderGradient>
        </div>
      </section>
    </main>
  );
}
