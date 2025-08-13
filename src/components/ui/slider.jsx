"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
  const handleChange = (e) => {
    const newValue = parseInt(e.target.value);
    if (onValueChange) {
      onValueChange([newValue]);
    }
  };

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)} ref={ref}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0] || 0}
        onChange={handleChange}
        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
        {...props}
      />
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
        }
      `}</style>
    </div>
  );
});

Slider.displayName = "Slider"

export { Slider }