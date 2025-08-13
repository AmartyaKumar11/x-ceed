"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center",
      checked ? "bg-primary text-primary-foreground" : "bg-background",
      className
    )}
    onClick={() => onChange && onChange(!checked)}
    {...props}
  >
    {checked && <Check className="h-3 w-3" />}
  </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }