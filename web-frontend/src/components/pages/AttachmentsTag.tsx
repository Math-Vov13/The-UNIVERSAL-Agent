import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Glimpse, GlimpseContent, GlimpseDescription, GlimpseImage, GlimpseTitle, GlimpseTrigger } from "../kibo-ui/glimpse";

export function AttachmentsTag({ index, file, onRemove }: { index: number, file: File, onRemove: (key: number) => void }) {
    return (
        <Glimpse closeDelay={300} openDelay={600}>
            <GlimpseTrigger asChild>
                <Badge className="text-sm text-gray-300 dark:bg-gray-800 bg-gray-200/10 border border-gray-700 px-2 flex items-center max-w-xs">
                    {file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name}
                    {file.size > 1024 * 1024 ? ` (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : file.size > 1024 ? ` (${(file.size / 1024).toFixed(2)} KB)` : ` (${file.size} B)`}
                    <button
                        title="Remove file"
                        type="button"
                        className="ml-1 text-gray-400 hover:text-purple-500 cursor-pointer hover:scale-110 transition-all"
                        onClick={() => onRemove(index)}
                    >
                        <X />
                    </button>
                </Badge>
            </GlimpseTrigger>
            <GlimpseContent className="w-80 bg-purple-900/10 border border-gray-700 rounded-md shadow-lg backdrop-blur-md overflow-hidden">
                <GlimpseTitle className='text-lg font-semibold text-purple-500'>{file.name}</GlimpseTitle>
                <GlimpseDescription className='text-gray-400'>{ "(" + file.type + ")" }</GlimpseDescription>
                <GlimpseImage className='border-2 border-gray-700' src={URL.createObjectURL(file)} />
            </GlimpseContent>
        </Glimpse>
    );
}