import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'default',
            'bg-slate-800 text-slate-100 hover:bg-slate-700': variant === 'secondary',
            'border border-white/10 bg-transparent hover:bg-white/5': variant === 'outline',
            'hover:bg-white/5': variant === 'ghost',
            'bg-red-500/10 text-red-500 hover:bg-red-500/20': variant === 'danger',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-lg px-3 text-sm': size === 'sm',
            'h-12 rounded-xl px-8 text-lg': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
