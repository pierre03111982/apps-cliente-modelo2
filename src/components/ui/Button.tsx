import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-accent-1 to-accent-2 text-white shadow-soft hover:shadow-lg focus-visible:ring-accent-1 focus-visible:ring-offset-white",
        secondary:
          "bg-accent-3/90 text-white shadow-soft hover:bg-accent-3 focus-visible:ring-accent-3 focus-visible:ring-offset-white",
        ghost:
          "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-accent-1 hover:text-accent-1 hover:shadow-md focus-visible:ring-accent-1 focus-visible:ring-offset-white",
        subtle:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-accent-2 focus-visible:ring-offset-white",
      },
      size: {
        default: "h-12 px-6 text-sm md:text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base md:text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || isLoading
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }


