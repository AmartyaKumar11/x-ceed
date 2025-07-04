import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const RANGE_OPTIONS = [
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last year", value: "1y" },
];

// Use theme variables for harmonious colors
const acceptedColor = "var(--chart-2)"; // green
const interviewColor = "var(--chart-3)"; // blue
const rejectedColor = "var(--chart-4)"; // red

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Custom Tooltip Content
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  // Find values for each status
  const accepted = payload.find(p => p.dataKey === "accepted")?.value ?? 0;
  const interview = payload.find(p => p.dataKey === "interview")?.value ?? 0;
  const rejected = payload.find(p => p.dataKey === "rejected")?.value ?? 0;
  return (
    <div className="flex gap-3 px-3 py-2 rounded-lg bg-[var(--popover)] shadow border border-[var(--border)]">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-[var(--primary)] inline-block" />
        <span className="text-sm font-medium text-[var(--primary)]">{accepted}</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-[var(--accent)] inline-block" />
        <span className="text-sm font-medium text-[var(--accent)]">{interview}</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-sm bg-[var(--destructive)] inline-block" />
        <span className="text-sm font-medium text-[var(--destructive)]">{rejected}</span>
      </span>
    </div>
  );
}

export default function ApplicationStatusAreaChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("30d");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/applications/status-daily?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch chart data");
        return res.json();
      })
      .then((data) => {
        setChartData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [range]);

  return (
    <Card className="w-full bg-card rounded-xl shadow-lg border-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 pt-6">
        {/* Legend as pill cards */}
        <div className="flex gap-3 mb-2">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--chart-2)]/10 text-[var(--chart-2)] text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--chart-2)]" /> Accepted
          </span>
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--chart-3)]/10 text-[var(--chart-3)] text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--chart-3)]" /> Interview
          </span>
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--chart-4)]/10 text-[var(--chart-4)] text-xs font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--chart-4)]" /> Rejected
          </span>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[160px] bg-muted border-none text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <CardContent>
        {loading ? (
          <div className="text-center py-10 text-foreground">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">{error}</div>
        ) : (
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={acceptedColor} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={acceptedColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInterview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={interviewColor} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={interviewColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={rejectedColor} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={rejectedColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickFormatter={formatDate}
                />
                <YAxis allowDecimals={false} stroke="#a1a1aa" fontSize={12} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#a1a1aa", strokeWidth: 1, opacity: 0.2 }}
                />
                <Area
                  type="monotone"
                  dataKey="accepted"
                  stackId="1"
                  stroke={acceptedColor}
                  fill="url(#colorAccepted)"
                  name="Accepted"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="interview"
                  stackId="1"
                  stroke={interviewColor}
                  fill="url(#colorInterview)"
                  name="Interview"
                  strokeWidth={2}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  stackId="1"
                  stroke={rejectedColor}
                  fill="url(#colorRejected)"
                  name="Rejected"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 