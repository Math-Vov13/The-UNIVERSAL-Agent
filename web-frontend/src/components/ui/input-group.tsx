"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ── InputGroup ────────────────────────────────────────────────────────────────

export type InputGroupProps = React.HTMLAttributes<HTMLDivElement>;

export function InputGroup({ className, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex flex-col rounded-xl border border-input bg-background shadow-sm transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className
      )}
      {...props}
    />
  );
}

// ── InputGroupAddon ───────────────────────────────────────────────────────────

export type InputGroupAddonProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "block-start" | "block-end";
};

export function InputGroupAddon({
  align = "block-end",
  className,
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn("flex items-center px-2 py-1.5", className)}
      {...props}
    />
  );
}

// ── InputGroupTextarea ────────────────────────────────────────────────────────

export type InputGroupTextareaProps = React.ComponentProps<"textarea">;

export function InputGroupTextarea({
  className,
  ...props
}: InputGroupTextareaProps) {
  return (
    <textarea
      data-slot="input-group-textarea"
      className={cn(
        "w-full resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

// ── InputGroupButton ──────────────────────────────────────────────────────────

const inputGroupButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "icon-sm",
    },
  }
);

export type InputGroupButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof inputGroupButtonVariants>;

export function InputGroupButton({
  className,
  variant,
  size,
  ...props
}: InputGroupButtonProps) {
  return (
    <button
      data-slot="input-group-button"
      className={cn(inputGroupButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
