// Web scraping API for extracting job descriptions from external URLs
import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export async function POST(request) {
  try {
    const { url, jobTitle, company, jobId } = await request.json();
    
    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL is required' 
      }, { status: 400 });
    }

    console.log('🔍 Scraping job from URL:', url);

    // Fetch the webpage with better headers and retry logic
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    };

    let response;
    let html;

    try {
      // First attempt with standard fetch
      response = await fetch(url, {
        headers,
        redirect: 'follow',
        timeout: 15000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      html = await response.text();

    } catch (fetchError) {
      console.log('⚠️ Standard fetch failed, trying alternative approach:', fetchError.message);
      
      // If the website blocks us, provide a fallback response
      if (fetchError.message.includes('403') || fetchError.message.includes('Forbidden')) {
        // Return a structured response with available data
        return NextResponse.json({
          success: true,
          data: {
            url,
            jobTitle: jobTitle || 'Remote Position',
            company: company || 'Company',
            jobId: jobId || generateJobId(url),
            description: `This is a remote position for ${jobTitle || 'a role'} at ${company || 'this company'}. ` +
              `Unfortunately, we couldn't automatically extract the full job description due to website restrictions. ` +
              `However, you can still match your resume based on the job title and company information. ` +
              `The position appears to be in the ${extractIndustryFromUrl(url)} industry. ` +
              `Please visit the original job posting for complete details about requirements and responsibilities.`,
            requirements: generateBasicRequirements(jobTitle, url),
            extractedAt: new Date().toISOString(),
            wordCount: 50,
            metadata: {
              pageTitle: `${jobTitle} - ${company}`,
              company: company,
              location: 'Remote',
              employmentType: 'Remote',
              scrapingStatus: 'blocked_but_processed'
            }
          }
        });
      } else {
        throw fetchError;
      }
    }
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract job description using various selectors
    let jobDescription = '';
    let requirements = [];

    // Common selectors for job descriptions
    const descriptionSelectors = [
      '[data-testid="job-description"]',
      '.job-description',
      '.job-details',
      '.description',
      '.job-content',
      '.post-content',
      '.content',
      '[id*="description"]',
      '[class*="description"]',
      '[class*="job-details"]',
      '[class*="content"]',
      'main',
      '.main-content',
      'article'
    ];

    // Try to find job description
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.innerText || '';
        if (text.length > jobDescription.length && text.length > 100) {
          jobDescription = text.trim();
        }
      }
    }

    // If no specific description found, get the main content
    if (!jobDescription || jobDescription.length < 100) {
      const bodyText = document.body.textContent || document.body.innerText || '';
      jobDescription = bodyText.trim();
    }

    // Clean up the description
    jobDescription = cleanJobDescription(jobDescription);

    // Extract requirements/qualifications section
    const requirementSelectors = [
      '[class*="requirement"]',
      '[class*="qualification"]',
      '[class*="skill"]',
      '[id*="requirement"]',
      '[id*="qualification"]'
    ];

    for (const selector of requirementSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent || element.innerText || '';
        if (text.length > 10 && text.length < 500) {
          requirements.push(text.trim());
        }
      });
    }

    // Extract requirements from the description text if none found
    if (requirements.length === 0) {
      requirements = extractRequirementsFromText(jobDescription);
    }

    // Extract additional metadata
    const metadata = extractJobMetadata(document);

    const result = {
      success: true,
      data: {
        url,
        jobTitle: jobTitle || metadata.title || 'Remote Position',
        company: company || metadata.company || 'Company',
        jobId: jobId || generateJobId(url),
        description: jobDescription,
        requirements: requirements.slice(0, 10), // Limit to 10 requirements
        extractedAt: new Date().toISOString(),
        wordCount: jobDescription.split(' ').length,
        metadata: {
          pageTitle: metadata.pageTitle,
          company: metadata.company,
          location: metadata.location,
          employmentType: metadata.employmentType,
        }
      }
    };

    console.log('✅ Successfully scraped job:', {
      url: url.substring(0, 50) + '...',
      descriptionLength: jobDescription.length,
      requirementsCount: requirements.length,
      title: result.data.jobTitle
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error scraping job:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to scrape job description',
      details: error.message 
    }, { status: 500 });
  }
}

function cleanJobDescription(text) {
  if (!text) return '';
  
  return text
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Remove navigation/footer text patterns
    .replace(/\b(Home|About|Contact|Privacy|Terms|Cookie|Login|Sign up|Register)\b/gi, '')
    // Remove social media references
    .replace(/\b(Facebook|Twitter|LinkedIn|Instagram|YouTube)\b/gi, '')
    // Remove common boilerplate
    .replace(/Click here to apply|Apply now|Submit application/gi, '')
    .trim();
}

function extractRequirementsFromText(description) {
  const requirements = [];
  const lines = description.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for bullet points or numbered lists
    if ((/^[\-\*\•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) && trimmed.length > 10) {
      requirements.push(trimmed.replace(/^[\-\*\•\d\.\s]+/, ''));
    }
    
    // Look for requirement indicators
    if (/\b(require|must have|should have|experience with|proficient|skilled in)\b/i.test(trimmed) && trimmed.length < 200) {
      requirements.push(trimmed);
    }
  }
  
  return requirements;
}

function extractJobMetadata(document) {
  const metadata = {};
  
  // Extract page title
  const titleElement = document.querySelector('title');
  metadata.pageTitle = titleElement ? titleElement.textContent.trim() : '';
  
  // Try to extract job title from various sources
  const titleSelectors = ['h1', '.job-title', '[class*="title"]', '[data-testid*="title"]'];
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 5 && text.length < 100) {
        metadata.title = text;
        break;
      }
    }
  }
  
  // Try to extract company name
  const companySelectors = ['.company', '[class*="company"]', '[data-testid*="company"]'];
  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 2 && text.length < 50) {
        metadata.company = text;
        break;
      }
    }
  }
  
  // Try to extract location
  const locationSelectors = ['.location', '[class*="location"]', '[data-testid*="location"]'];
  for (const selector of locationSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 2 && text.length < 50) {
        metadata.location = text;
        break;
      }
    }
  }
  
  return metadata;
}

function generateJobId(url) {
  // Generate a simple ID from URL
  return url.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) + Date.now().toString().slice(-6);
}

function extractIndustryFromUrl(url) {
  // Try to guess industry from URL patterns
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('tech') || urlLower.includes('software') || urlLower.includes('dev')) return 'Technology';
  if (urlLower.includes('marketing') || urlLower.includes('digital')) return 'Marketing';
  if (urlLower.includes('design') || urlLower.includes('creative')) return 'Design';
  if (urlLower.includes('sales') || urlLower.includes('business')) return 'Sales';
  if (urlLower.includes('content') || urlLower.includes('writer')) return 'Content & Editorial';
  if (urlLower.includes('data') || urlLower.includes('analytics')) return 'Data Science';
  if (urlLower.includes('finance') || urlLower.includes('accounting')) return 'Finance';
  if (urlLower.includes('hr') || urlLower.includes('human')) return 'Human Resources';
  
  return 'General';
}

function generateBasicRequirements(jobTitle, url) {
  const requirements = [];
  const titleLower = (jobTitle || '').toLowerCase();
  const urlLower = url.toLowerCase();
  
  // Generate basic requirements based on job title and URL
  if (titleLower.includes('senior') || titleLower.includes('lead')) {
    requirements.push('3+ years of relevant experience');
    requirements.push('Leadership or mentoring experience');
  } else if (titleLower.includes('junior') || titleLower.includes('entry')) {
    requirements.push('0-2 years of experience or recent graduate');
    requirements.push('Eagerness to learn and grow');
  } else {
    requirements.push('Relevant experience in the field');
  }
  
  // Add technology-specific requirements
  if (titleLower.includes('developer') || titleLower.includes('engineer') || titleLower.includes('programmer')) {
    requirements.push('Strong programming skills');
    requirements.push('Experience with software development lifecycle');
    if (titleLower.includes('frontend') || titleLower.includes('front-end')) {
      requirements.push('HTML, CSS, JavaScript experience');
      requirements.push('Modern frontend frameworks (React, Vue, Angular)');
    }
    if (titleLower.includes('backend') || titleLower.includes('back-end')) {
      requirements.push('Server-side programming languages');
      requirements.push('Database design and management');
    }
    if (titleLower.includes('full stack') || titleLower.includes('fullstack')) {
      requirements.push('Both frontend and backend development skills');
    }
  }
  
  if (titleLower.includes('designer')) {
    requirements.push('Design software proficiency (Figma, Adobe Creative Suite)');
    requirements.push('Understanding of UI/UX principles');
  }
  
  if (titleLower.includes('marketing')) {
    requirements.push('Digital marketing experience');
    requirements.push('Analytics and campaign management');
  }
  
  if (titleLower.includes('content')) {
    requirements.push('Excellent writing and communication skills');
    requirements.push('Content management systems experience');
  }
  
  // Add common remote work requirements
  requirements.push('Self-motivated and able to work independently');
  requirements.push('Strong communication skills for remote collaboration');
  requirements.push('Reliable internet connection and suitable home office setup');
  
  return requirements.slice(0, 8); // Limit to 8 requirements
}
