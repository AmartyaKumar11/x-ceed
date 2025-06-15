// Test the jobs API endpoint
const testJobAPI = async () => {
  try {
    console.log('🧪 Testing Jobs API...');
    
    // First, let's get all jobs to see what's available
    const allJobsResponse = await fetch('/api/jobs');
    
    if (allJobsResponse.ok) {
      const allJobs = await allJobsResponse.json();
      console.log('📋 All jobs response:', allJobs);
      
      if (allJobs.jobs && allJobs.jobs.length > 0) {
        const firstJob = allJobs.jobs[0];
        console.log('🎯 Testing with first job ID:', firstJob._id);
        
        // Now test fetching a specific job
        const singleJobResponse = await fetch(`/api/jobs/${firstJob._id}`);
        
        if (singleJobResponse.ok) {
          const singleJob = await singleJobResponse.json();
          console.log('✅ Single job response:', singleJob);
          console.log('✅ Job title:', singleJob.job?.title);
        } else {
          console.error('❌ Single job fetch failed:', singleJobResponse.status);
          const errorText = await singleJobResponse.text();
          console.error('❌ Error:', errorText);
        }
      } else {
        console.log('📋 No jobs found in database');
      }
    } else {
      console.error('❌ All jobs fetch failed:', allJobsResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run test
testJobAPI();
