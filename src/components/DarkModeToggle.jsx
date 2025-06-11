'use client';

import { useTheme } from 'next-themes';
import { Toggle } from '@/components/ui/toggle';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleToggle = (pressed) => {
    setTheme(pressed ? 'dark' : 'light');
  };

  return (
    <Toggle
      pressed={isDark}
      onPressedChange={handleToggle}
      size="lg"
      className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-all duration-300 ease-in-out group data-[state=on]:bg-muted"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="transition-transform duration-500 ease-in-out group-hover:scale-110"
        style={{
          transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.5s ease-in-out'
        }}
      >        {isDark ? (
          <Moon className="h-5 w-5 text-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-foreground" />
        )}
      </div>
    </Toggle>
  );
}
