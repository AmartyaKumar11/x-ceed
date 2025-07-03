import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('results_per_page'), 10) || 10;

  // Remotive API endpoint
  const apiUrl = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch jobs from Remotive.' }, { status: 500 });
    }
    const data = await response.json();
    // Normalize job data
    const jobs = (data.jobs || []).slice(0, limit).map(job => ({
      id: job.id,
      title: job.title,
      companyName: job.company_name,
      location: job.candidate_required_location,
      description: job.description,
      redirectUrl: job.url,
      createdAt: job.publication_date,
      salaryMin: null, // Remotive does not provide min salary
      salaryMax: null, // Remotive does not provide max salary
      currency: null,  // Remotive does not provide currency
      jobType: job.job_type,
      category: job.category,
    }));
    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 