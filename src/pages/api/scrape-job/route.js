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

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
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
