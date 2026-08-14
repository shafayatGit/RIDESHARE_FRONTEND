import * as React from "react"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  startIcon?: LucideIcon
  endIcon?: LucideIcon
}

function Input({
  className,
  type,
  startIcon: StartIcon,
  endIcon: EndIcon,
  ...props
}: InputProps) {
  return (
    <div className="relative flex items-center w-full">
      {StartIcon && (
        <StartIcon className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          StartIcon && "pl-8",
          EndIcon && "pr-8",
          className
        )}
        {...props}
      />
      {EndIcon && (
        <EndIcon className="absolute right-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
    </div>
  )
}

export { Input }