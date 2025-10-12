'use client';
import BlurText from "@/components/BlurText";
import Magnet from "@/components/Magnet";
import Orb from "@/components/Orb";
import BadgeContainer from "@/components/pages/BadgesContainer";
import ChatBarProps from "@/components/pages/ChatBar";
import { useHistory } from "@/components/Providers/historyProvider";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChatBarSuspense({ start }: { start: { content: string, files: FileList | null } | undefined }) {
    const params = useSearchParams();
    const m = (params.get('m') || '').trim();

    return <ChatBarProps stateBar="create" text={m} blocked={start !== undefined} />;
}


export default function ChatPage() {
    const { start } = useHistory();
    return (
        <main className="flex flex-col h-screen">
            <div className="absolute top-[10%] left-0 z-[-1] w-full h-[80%] pointer-events-none">
                <Orb
                    hoverIntensity={0.5}
                    rotateOnHover={false}
                    hue={0}
                    forceHoverState={false}
                />
            </div>
            <div className="mx-auto my-auto flex flex-col items-center justify-center w-full h-full gap-10 px-4">
                <div className="flex flex-col items-center justify-center">
                    <BlurText text="Hey Math, what's news ?" className="text-6xl text-purple-400 font-extrabold text-center mt-10 mb-5" />

                    <BadgeContainer />
                </div>

                <div className="flex items-center justify-center"></div>
                <div className="flex items-center justify-center min-w-[300px] sm:w-full md:w-2/5">
                <Magnet padding={50} disabled={false} magnetStrength={50} className="w-full" >
                    <Suspense fallback={<ChatBarProps stateBar="create" blocked={true} text="loading..." />}>
                        <ChatBarSuspense start={start} />
                    </Suspense>
                </Magnet>
                </div>
            </div>
            <ShootingStars className="z-[-1]" />
            <StarsBackground className="z-[-2]" />
        </main>
    );
}
