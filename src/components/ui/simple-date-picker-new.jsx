"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function SimpleDatePicker({ className, selected, onSelect, placeholder = "Pick a date", disabled }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)

  // Close calendar when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDateSelect = (date) => {
    console.log('Date clicked:', date)
    if (date) {
      onSelect?.(date)
      setIsOpen(false)
    }
  }

  const isValidDate = (date) => {
    return date && date instanceof Date && !isNaN(date.getTime())
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left font-normal"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {isValidDate(selected) ? format(selected, "PPP") : placeholder}
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-[9999] mt-1 rounded-md border bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDateSelect}
            disabled={disabled}
            showOutsideDays={false}
            className="rdp"
            styles={{
              caption: { display: 'flex', justifyContent: 'center', marginBottom: '1rem' },
              table: { width: '100%', borderCollapse: 'collapse' },
              head_cell: { width: '2.25rem', height: '2.25rem', textAlign: 'center', fontSize: '0.875rem' },
              cell: { width: '2.25rem', height: '2.25rem', textAlign: 'center', padding: 0 },
              day: { 
                width: '2.25rem', 
                height: '2.25rem', 
                border: 'none', 
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              },
              day_selected: { 
                backgroundColor: '#3b82f6', 
                color: 'white' 
              },
              day_today: { 
                backgroundColor: '#f3f4f6',
                fontWeight: 'bold'
              },
              day_disabled: {
                color: '#9ca3af',
                cursor: 'not-allowed'
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
