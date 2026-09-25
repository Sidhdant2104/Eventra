import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] transition duration-200 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-[#e23418]",
        brand: "bg-ink text-white hover:bg-black",
        ink: "bg-ink text-white hover:bg-black",
        outline: "border border-line bg-surface text-ink hover:border-ink",
        ghost: "text-ink hover:bg-ink/5",
        danger: "bg-bad text-white hover:bg-[#9e1c13]",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ variant, size }), "rounded-[2px]", className)} {...props} />;
}

export function ButtonLink({
  className,
  variant,
  size,
  href,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonStyles>) {
  return <Link href={href} className={cn(buttonStyles({ variant, size }), "rounded-[2px]", className)} {...props} />;
}

export function IconButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("grid h-10 w-10 place-items-center rounded-[2px] text-ink transition hover:bg-ink/5", className)} {...props} />;
}

const fieldClass = "w-full rounded-[2px] border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none transition placeholder:text-muted/80 focus:border-ink";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input ref={ref} {...props} className={cn(fieldClass, props.className)} />;
});

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClass, "min-h-28 resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-[13px] font-medium text-secondary", className)} {...props} />;
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error ? <p className="mt-1 text-sm text-bad">{error}</p> : null}
    </div>
  );
}

const badgeStyles = cva("inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em]", {
  variants: {
    tone: {
      neutral: "bg-ink/5 text-secondary",
      brand: "bg-ink text-white",
      good: "bg-[#e7f6ee] text-good",
      warn: "bg-[#fff4df] text-warn",
      bad: "bg-[#fdecea] text-bad",
      ink: "bg-ink text-white",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeStyles>) {
  return <span className={cn(badgeStyles({ tone }), className)} {...props} />;
}

export function StatusBadge({ status }: { status: string }) {
  const good = ["CONFIRMED", "ATTENDED", "PUBLISHED", "REGISTERED", "ACCEPTED"].includes(status);
  const bad = ["CANCELLED", "REJECTED", "ARCHIVED"].includes(status);
  const warn = ["WAITLISTED", "PENDING", "DRAFT", "FORMING"].includes(status);
  return <Badge tone={good ? "good" : bad ? "bad" : warn ? "warn" : "neutral"}>{status.replaceAll("_", " ").toLowerCase()}</Badge>;
}

export function Alert({ tone = "bad", children }: { tone?: "bad" | "good" | "warn"; children: React.ReactNode }) {
  const styles = tone === "good" ? "border-good/30 bg-[#e7f6ee] text-good" : tone === "warn" ? "border-warn/30 bg-[#fff4df] text-warn" : "border-bad/30 bg-[#fdecea] text-bad";
  return <div role="alert" className={cn("border px-4 py-3 text-sm", styles)}>{children}</div>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-line px-6 py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Nothing here yet</p>
      <h2 className="mt-3 max-w-md font-display text-4xl">{title}</h2>
      <p className="mt-3 max-w-md text-[15px] leading-7 text-secondary">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border border-line bg-surface", className)} {...props} />;
}

export function Avatar({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  return (
    <span className={cn("grid h-9 w-9 place-items-center overflow-hidden bg-ink text-[12px] font-medium text-white", className)}>
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function SectionHeader({ kicker, title, action }: { kicker?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker ? <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{kicker}</p> : null}
        <h2 className="mt-1 font-display text-4xl sm:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-ink/8", className)} />;
}
