import React from "react";
import Link from "next/link";
import { Link as IconLink } from 'lucide-react';
import {
    Glimpse,
    GlimpseContent,
    GlimpseDescription,
    GlimpseImage,
    GlimpseTitle,
    GlimpseTrigger,
} from "@/components/kibo-ui/glimpse";
import { glimpse } from "@/components/kibo-ui/glimpse/server";

export default function LinkPreview({ href, children, ...rest }: { href: string; children: React.ReactNode }) {
    const [loading, setLoading] = React.useState(false);
    const [linkData, setLinkData] = React.useState<{
        title: string | null;
        description: string | null;
        image: string | null;
    }>({ title: null, description: null, image: null });

    return (
        <Glimpse closeDelay={300} openDelay={600}>
            <GlimpseTrigger asChild>
                <Link
                    target='_blank'
                    prefetch={false}
                    rel='noopener noreferrer'
                    className="inline-flex items-baseline text-gray-500 hover:text-purple-500 hover:underline"
                    href={href ?? ''}
                    onMouseEnter={() => {
                        if (!loading && !linkData.title) {
                            const fetchData = async () => {
                                setLoading(true);
                                const result = await glimpse(href || '');
                                setLinkData(result);
                                setLoading(false);
                            };
                            fetchData();
                        }
                    }}
                    {...rest}
                >
                    <span className="whitespace-pre-wrap leading-tight">{children}</span>
                    <IconLink className="ml-2 w-4 h-4 inline-block flex-shrink-0 self-baseline" />
                </Link>
            </GlimpseTrigger>
            {linkData.title && (
                <GlimpseContent className="w-80 bg-purple-900/10 border border-gray-700 rounded-md shadow-lg backdrop-blur-md overflow-hidden">
                    <Link
                        className='cursor-pointer'
                        prefetch={false}
                        target='_blank'
                        href={'/proxy/redirect?url=' + (href ?? '') + '&redirTk=' + '123456789012345678'}
                    >
                        <GlimpseTitle className='text-lg font-semibold text-purple-500 underline'>{linkData.title}</GlimpseTitle>
                        <GlimpseDescription className='text-gray-400'>{linkData.description}</GlimpseDescription>
                        <GlimpseImage className='border-6 border-gray-700' src={linkData.image ?? href} />
                    </Link>
                </GlimpseContent>
            )}
        </Glimpse>
    );
};