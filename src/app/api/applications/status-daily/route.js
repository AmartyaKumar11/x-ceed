import { getDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// Helper to get date N days ago
function getStartDate(range) {
  const now = new Date();
  if (range === '1y') {
    now.setFullYear(now.getFullYear() - 1);
  } else if (range === '3m') {
    now.setMonth(now.getMonth() - 3);
  } else {
    now.setDate(now.getDate() - 30);
  }
  now.setHours(0, 0, 0, 0);
  return now;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '30d';
    const startDate = getStartDate(range);

    const db = await getDatabase();
    const pipeline = [
      {
        $match: {
          status: { $in: ['accepted', 'interview', 'rejected'] },
          appliedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          counts: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const results = await db.collection('applications').aggregate(pipeline).toArray();

    // Debug: log raw aggregation results
    console.log('Raw aggregation results:', JSON.stringify(results, null, 2));

    // Format results for chart
    const data = results.map(day => {
      const base = { date: day._id, accepted: 0, interview: 0, rejected: 0 };
      day.counts.forEach(s => {
        base[s.status] = s.count;
      });
      return base;
    });

    // Debug: log formatted chart data
    console.log('Formatted chart data:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 