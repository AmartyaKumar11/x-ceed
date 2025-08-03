// API route to fetch remote jobs from Jobicy
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      count = 50, 
      geo = '', 
      industry = '', 
      tag = '',
      q = '',
      page = 1 
    } = req.query;

    // Build query parameters for Jobicy API
    // NOTE: Jobicy API doesn't support generic 'q' parameter, only 'tag' parameter works
    // We transform search queries to tag-based searches for compatibility
    const params = new URLSearchParams();
    if (count) params.append('count', count);
    if (geo) params.append('geo', geo);
    if (industry) params.append('industry', industry);
    if (tag) params.append('tag', tag);
    // Transform generic query 'q' into a tag search for Jobicy API compatibility
    if (q && !tag) {
      params.append('tag', q);
    }

    const jobicyUrl = `https://jobicy.com/api/v2/remote-jobs?${params.toString()}`;
    
    console.log('🔍 Fetching jobs from Jobicy:', jobicyUrl);

    const response = await fetch(jobicyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      console.error(`❌ Jobicy API error: ${response.status} ${response.statusText}`);
      
      // If it's a 400 error, it might be due to invalid search parameters
      if (response.status === 400) {
        throw new Error(`Search query not supported. Try using specific job titles or technologies instead of generic terms.`);
      }
      
      throw new Error(`Jobicy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Jobicy data to match our job card format
    const transformedJobs = data.jobs?.map(job => ({
      _id: job.id || `jobicy-${Date.now()}-${Math.random()}`,
      title: job.jobTitle || 'Unknown Title',
      company: job.companyName || 'Unknown Company',
      location: job.jobGeo || 'Remote',
      type: job.jobType || 'Full-time',
      salary: job.annualSalaryMin && job.annualSalaryMax 
        ? `$${job.annualSalaryMin.toLocaleString()} - $${job.annualSalaryMax.toLocaleString()}` 
        : job.salaryRange || 'Not specified',
      description: job.jobExcerpt || job.jobDescription || 'No description available',
      requirements: job.jobDescription || 'No requirements specified',
      postedDate: job.pubDate || new Date().toISOString(),
      applicationUrl: job.url || '#',
      tags: job.jobTags || [],
      industry: job.jobIndustry || 'Technology',
      level: job.jobLevel || 'Mid-level',
      remote: true,
      source: 'jobicy',
      companyLogo: job.companyLogo || null,
      // Additional fields for filtering
      department: job.jobCategory || 'Engineering',
      workMode: 'Remote',
      // Format posted date for display
      postedDateFormatted: job.pubDate ? new Date(job.pubDate).toLocaleDateString() : 'Recently',
      postedDateRelative: job.pubDate ? getRelativeTime(job.pubDate) : 'Recently posted'
    })) || [];

    console.log(`✅ Successfully fetched ${transformedJobs.length} jobs from Jobicy`);

    return res.status(200).json({
      success: true,
      jobs: transformedJobs,
      total: data.count || transformedJobs.length,
      page: parseInt(page),
      source: 'jobicy'
    });

  } catch (error) {
    console.error('❌ Error fetching jobs from Jobicy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs from Jobicy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Helper function to get relative time
function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2419200)} months ago`;
}
