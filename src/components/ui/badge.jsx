import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-black text-white",
        secondary:
          "border-transparent bg-gray-100 text-gray-900",
        destructive:
          "border-transparent bg-red-500 text-white",
        outline:
          "text-gray-950 border-gray-200",
        success: 
          "border-transparent bg-green-100 text-green-800",
        active:
          "border-transparent bg-black text-white hover:bg-gray-800",
        inactive:
          "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  ...props
}) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
