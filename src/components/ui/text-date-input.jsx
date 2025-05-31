"use client"

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A component for text-based date input in DD-MM-YY format
 */
export function TextDateInput({
  className,
  value,
  onChange,
  placeholder = "DD-MM-YY",
  ...props
}) {
  // Initialize with value from props if available
  const [dateString, setDateString] = React.useState(() => {
    if (value && value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = String(value.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    }
    return "";
  });

  // Helper function to validate date format
  const isValidFormat = (text) => {
    return /^\d{2}-\d{2}-\d{2}$/.test(text);
  };

  // Helper function to convert DD-MM-YY to Date object
  const parseDate = (text) => {
    if (!isValidFormat(text)) return null;
    
    const [day, month, yearShort] = text.split('-');
    
    // Convert 2-digit year to 4-digit year
    // Assume 00-69 is 2000-2069, 70-99 is 1970-1999
    const yearNum = parseInt(yearShort);
    const fullYear = yearNum >= 0 && yearNum < 70 ? 2000 + yearNum : 1900 + yearNum;
    
    // Month is 0-indexed in JavaScript Date
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    
    // Validate that the parsed date is correct (handles invalid dates like 31/02)
    if (
      date.getDate() !== parseInt(day) ||
      date.getMonth() !== parseInt(month) - 1 ||
      date.getFullYear() % 100 !== yearNum
    ) {
      return null;
    }
    
    return date;
  };

  // Handle input changes
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    // Allow empty value or values that could be formatted as DD-MM-YY
    if (newValue === "" || /^[\d-]*$/.test(newValue)) {
      setDateString(newValue);
      
      // Auto-format with hyphens as they type
      if (newValue.length === 2 && !newValue.includes('-')) {
        setDateString(`${newValue}-`);
      } else if (newValue.length === 5 && newValue.indexOf('-', 3) === -1) {
        setDateString(`${newValue}-`);
      }
      
      // Only call onChange if we have a valid date or empty string
      if (newValue === "") {
        onChange?.(null);
      } else if (isValidFormat(newValue)) {
        const date = parseDate(newValue);
        if (date) {
          onChange?.(date);
        }
      }
    }
  };

  // Handle blur to format or clear the input
  const handleBlur = () => {
    if (dateString && !isValidFormat(dateString)) {
      setDateString("");
      onChange?.(null);
    } else if (dateString) {
      const date = parseDate(dateString);
      if (!date) {
        setDateString("");
        onChange?.(null);
      }
    }
  };

  return (
    <Input
      type="text"
      value={dateString}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("w-full", className)}
      {...props}
    />
  );
}
