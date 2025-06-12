"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Simple direct select component that doesn't rely on Radix UI
export function SelectDirect({ 
  options = [], 
  placeholder = "Select option",
  value,
  onValueChange,
  className
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value)
  
  const handleSelect = (option) => {
    setSelectedValue(option)
    onValueChange?.(option)
    setIsOpen(false)
  }

  // Display the option label instead of raw value if available
  const displayValue = React.useMemo(() => {
    if (!selectedValue) return placeholder;
    const option = options.find(o => 
      typeof o === 'object' ? o.value === selectedValue : o === selectedValue
    );
    return typeof option === 'object' ? option.label : option;
  }, [selectedValue, options, placeholder]);

  return (
    <div className={cn("relative w-full", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>        {isOpen && (
        <div className="absolute top-full left-0 z-[9999] w-full mt-1 rounded-md border bg-popover text-popover-foreground p-1 shadow-md">
          <div className="max-h-[200px] overflow-auto">
            {options.map((option, index) => {
              const value = typeof option === 'object' ? option.value : option;
              const label = typeof option === 'object' ? option.label : option;
              const isSelected = selectedValue === value;
              
              return (
                <div
                  key={`${value}-${index}`}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none",
                    isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(value)}
                >
                  <span className="flex-1">{label}</span>
                  {isSelected && (
                    <CheckIcon className="h-4 w-4 ml-2" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
