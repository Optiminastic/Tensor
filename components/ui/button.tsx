import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-landing-lime text-landing-ink hover:bg-landing-lime-deep',
        secondary:
          'border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted',
        ghost: 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
        danger: 'bg-danger text-white hover:opacity-90',
        link: 'text-foreground underline underline-offset-4 hover:opacity-80',
        // Soft actions in the tag palette (app/globals.css), for a row of
        // actions that would otherwise be four identical outlines: the colour
        // says what each does - green moves the job on, amber redoes it, red
        // reports a problem, grey steps past it. The label always says it too.
        'soft-success': 'tag tag-success hover:brightness-[0.97] dark:hover:brightness-125',
        'soft-warning': 'tag tag-warning hover:brightness-[0.97] dark:hover:brightness-125',
        'soft-danger': 'tag tag-danger hover:brightness-[0.97] dark:hover:brightness-125',
        'soft-muted': 'tag tag-muted hover:brightness-[0.97] dark:hover:brightness-125',
      },
      size: {
        sm: 'h-8 px-3 text-[0.8125rem]',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-sm',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})

export { buttonVariants }
