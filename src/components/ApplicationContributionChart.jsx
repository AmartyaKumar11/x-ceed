import React from "react";

// Helper: get YYYY-MM-DD string
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper: get array of last N days (oldest first)
function getLastNDates(n) {
  const dates = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

// Color scale: 0 = bg-muted, 1 = bg-accent/20, 2 = bg-accent/40, 3 = bg-primary/60, 4+ = bg-primary
function getColor(count) {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-accent/20";
  if (count === 2) return "bg-accent/40";
  if (count === 3) return "bg-primary/60";
  return "bg-primary";
}

export default function ApplicationContributionChart({ applications = [] }) {
  // Map: date string => count
  const counts = {};
  applications.forEach(app => {
    const rawDate = app.appliedDate || app.createdAt;
    const dateObj = new Date(rawDate);
    if (!rawDate || isNaN(dateObj.getTime())) return; // skip invalid
    const dateStr = formatDate(dateObj);
    counts[dateStr] = (counts[dateStr] || 0) + 1;
  });

  // 78 weeks = 546 days (18 months)
  const numDays = 78 * 7;
  const allDates = getLastNDates(numDays);

  // Build grid: columns = weeks, rows = days (Sun-Sat)
  const weeks = [];
  for (let w = 0; w < 78; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const idx = w * 7 + d;
      const date = allDates[idx];
      const count = counts[date] || 0;
      week.push({ date, count });
    }
    weeks.push(week);
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(78, 1fr)`,
          gridTemplateRows: `repeat(7, 1fr)`,
          width: "100%",
          height: "100%", // fill the card vertically
          gap: "2px",
        }}
      >
        {weeks.flat().map((cell, idx) => (
          <div
            key={cell.date}
            className={`w-full h-full rounded ${getColor(cell.count)} border border-border cursor-pointer`}
            title={`${cell.date}: ${cell.count} application${cell.count !== 1 ? 's' : ''}`}
          />
        ))}
      </div>
    </div>
  );
} 