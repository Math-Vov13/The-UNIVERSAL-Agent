"use client";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPinHouse } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";

export default function BadgeContainer() {
    const [time, setTime] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTime(new Date());
    }, []);

    useLayoutEffect(() => {
        if (!mounted) return;
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [mounted]);

    return (
        <div className="flex items-center justify-center gap-4 mt-2">
            <Badge className="bg-purple-700/40 backdrop-blur-md"><MapPinHouse /> Paris / France</Badge>
            <Badge className="bg-gray-700"><Clock /> {mounted && time ? time.toLocaleTimeString() : '--:--:--'}</Badge>
            <Badge className="text-purple-400 hover:underline bg-purple-700/40 backdrop-blur-md">
                <Link href="/pricing#pro" className="cursor-pointer">Pro Tier</Link>
            </Badge>
        </div>
    );
}
