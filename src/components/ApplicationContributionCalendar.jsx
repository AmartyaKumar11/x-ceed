import React, { useMemo, useRef, useEffect, useState } from "react";
import { timeDays, timeWeeks, timeMonths, timeYear, timeSunday } from "d3-time";
import { format, parseISO, isValid } from "date-fns";

// Helper: get date string YYYY-MM-DD
function formatDate(date) {
  return format(date, "yyyy-MM-dd");
}

// Helper: get valid date from string or Date
function getValidDate(raw) {
  if (!raw) return null;
  const d = typeof raw === "string" ? parseISO(raw) : new Date(raw);
  return isValid(d) ? d : null;
}

// Color scale: 0 = bg-muted, 1 = bg-primary/40, 2 = bg-primary/60, 3 = bg-primary/80, 4+ = bg-primary
const COLOR_SCALE = [
  "bg-muted",         // 0
  "bg-primary/40",   // 1 (brighter, more visible)
  "bg-primary/60",   // 2
  "bg-primary/80",   // 3
  "bg-primary"       // 4+
];
function getColor(count) {
  if (count === 0) return COLOR_SCALE[0];
  if (count === 1) return COLOR_SCALE[1];
  if (count === 2) return COLOR_SCALE[2];
  if (count === 3) return COLOR_SCALE[3];
  return COLOR_SCALE[4];
}

export default function ApplicationContributionCalendar({ applications = [], weeks = 20, minCellSize = 13, maxCellSize = 22 }) {
  // Responsive cell size
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(minCellSize);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Ensure we have a reasonable minimum width
        const actualWidth = Math.max(width, 600);
        // 8px gap per week, 7px for 7 rows
        const possibleCell = Math.floor((actualWidth - (weeks - 1) * 2 - 32) / weeks);
        const newCellSize = Math.max(minCellSize, Math.min(maxCellSize, possibleCell));
        setCellSize(newCellSize);
        
        // Mark as loaded after first successful resize
        if (!isLoaded && actualWidth > 0) {
          setIsLoaded(true);
        }
      }
    }
    
    // Force multiple resize attempts with increasing delays
    const timeouts = [
      setTimeout(updateSize, 0),      // Immediate
      setTimeout(updateSize, 50),     // Very quick
      setTimeout(updateSize, 100),    // Quick
      setTimeout(updateSize, 200),    // Medium
      setTimeout(updateSize, 400),    // Slower
      setTimeout(updateSize, 800),    // Even slower
      setTimeout(updateSize, 1200),   // Final attempt
    ];
    
    // Initial size calculation
    updateSize();
    
    // Use ResizeObserver for more reliable container size detection
    let resizeObserver;
    if (containerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === containerRef.current) {
            setTimeout(updateSize, 10);
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateSize);
    window.addEventListener('load', updateSize);
    // Also listen for orientation change on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(updateSize, 200);
    });
    
    // Force recalculation when document is ready
    if (document.readyState === 'complete') {
      setTimeout(updateSize, 50);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateSize, 100);
      });
    }
    
    // Additional check after images and other resources load
    window.addEventListener('load', () => {
      setTimeout(updateSize, 150);
    });
    
    // Fallback: mark as loaded after a reasonable timeout
    const fallbackTimeout = setTimeout(() => {
      if (!isLoaded) {
        setIsLoaded(true);
      }
    }, 1000);
    
    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(fallbackTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('load', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      document.removeEventListener('DOMContentLoaded', updateSize);
    };
  }, [weeks, minCellSize, maxCellSize, isLoaded]);

  // 1. Build date -> count map
  const counts = useMemo(() => {
    const map = new Map();
    applications.forEach(app => {
      const d = getValidDate(app.appliedAt || app.appliedDate || app.createdAt);
      if (!d) return;
      const key = formatDate(d);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [applications]);

  // 2. Calculate date range (last N weeks, starting from last Sunday)
  const today = new Date();
  const end = timeSunday.ceil(today); // next Sunday
  const start = timeSunday.offset(end, -weeks);
  const days = timeDays(start, end);
  const months = timeMonths(start, end);

  // 3. Build grid: columns = weeks, rows = days (Sun-Sat)
  const grid = [];
  for (let i = 0; i < days.length; i++) {
    const date = days[i];
    const week = Math.floor(i / 7);
    const day = date.getDay();
    if (!grid[week]) grid[week] = [];
    grid[week][day] = date;
  }

  // 4. No data message
  const hasData = applications.length > 0 && Array.from(counts.values()).some(v => v > 0);
  if (!hasData) {
    return (
      <div className="text-muted-foreground text-center py-8">
        No application activity yet. Start applying to jobs!
      </div>
    );
  }

  // 5. Render
  // Improved GitHub-style month label logic
  const monthLabels = [];
  let lastMonth = null;
  grid.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay) {
      const month = firstDay.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ week: wi, label: format(firstDay, "MMM") });
        lastMonth = month;
      }
    }
  });

    return (
    <div ref={containerRef} className={`contribution-chart-container w-full ${isLoaded ? 'loaded' : ''}`}>
      {/* Month labels */}
      <div className="flex ml-8 mb-1" style={{ height: 16 }}>
        {grid.map((_, wi) => {
          const month = monthLabels.find(m => m.week === wi);
          return (
            <div key={wi} style={{ width: cellSize, minWidth: cellSize }} className="text-xs text-muted-foreground text-center">
              {month ? month.label : ''}
            </div>
          );
        })}
      </div>
      <div className="flex">
        {/* Day labels (S, M, W, F) on correct rows */}
        <div className="flex flex-col mr-1 select-none" style={{ height: cellSize * 7 + 6 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{ height: cellSize, width: 16 }}
              className="text-xs text-muted-foreground text-center"
            >
              {i === 0 ? 'S' : i === 1 ? 'M' : i === 3 ? 'W' : i === 5 ? 'F' : ''}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[2px]">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const date = week[di];
                const key = date ? formatDate(date) : `empty-${di}`;
                const count = date ? counts.get(key) || 0 : 0;
                return (
                  <div
                    key={key}
                    className={`rounded-sm ${getColor(count)} border border-border${count > 0 ? ' ring-1 ring-primary/60' : ''} cursor-pointer transition-colors`}
                    style={{ width: cellSize, height: cellSize }}
                    title={date ? `${format(date, "yyyy-MM-dd")}: ${count} application${count !== 1 ? "s" : ""}` : ""}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 ml-8">
        <span className="text-xs text-muted-foreground">Less</span>
        {COLOR_SCALE.map((cls, i) => (
          <div key={i} className={`rounded-sm border border-border ${cls}`} style={{ width: cellSize, height: cellSize }} />
        ))}
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
} 