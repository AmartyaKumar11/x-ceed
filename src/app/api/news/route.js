import { NextResponse } from 'next/server';

// Different tech search queries to rotate through for variety
const TECH_QUERIES = [
  'artificial intelligence OR machine learning OR AI OR "deep learning"',
  'programming OR "software development" OR coding OR "web development"',
  'technology OR "tech news" OR startup OR innovation',
  'javascript OR react OR node.js OR typescript OR "frontend development"',
  'python OR "data science" OR automation OR "backend development"',
  'cloud computing OR AWS OR Azure OR "Google Cloud" OR DevOps',
  'cybersecurity OR "data privacy" OR blockchain OR cryptocurrency',
  'mobile development OR iOS OR Android OR "app development"',
  '"open source" OR GitHub OR "software engineering" OR API',
  'quantum computing OR robotics OR IoT OR "internet of things"'
];

// Different news domains to vary sources
const DOMAINS = [
  'techcrunch.com,theverge.com,arstechnica.com',
  'wired.com,engadget.com,thenextweb.com',
  'venturebeat.com,mashable.com,recode.net',
  'zdnet.com,computerworld.com,infoworld.com'
];

export async function GET(request) {
  try {
    console.log('🔄 Fetching fresh tech news with rotation...');
    
    // Get parameters
    const url = new URL(request.url);
    const isManualRefresh = url.searchParams.get('refresh') === 'true';
    const providedSeed = parseInt(url.searchParams.get('seed'));
    
    // Create unique seed - for manual refresh, use provided seed, otherwise use time-based
    const now = new Date();
    let seed;
    
    if (isManualRefresh && providedSeed) {
      seed = providedSeed;
      console.log(`🎯 Manual refresh with seed: ${seed}`);
    } else {
      seed = Math.floor(now.getTime() / (5 * 60 * 1000)); // Changes every 5 minutes
      console.log(`⏰ Auto refresh with time-based seed: ${seed}`);
    }
    
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
      if (!NEWS_API_KEY) {
      // Fallback to mock data if no API key is provided, but make it dynamic
      const mockSeed = seed % 3;
      console.log(`🎭 Using mock data set: ${mockSeed + 1}/3`);
      const mockArticles = [
        [
          {
            id: `mock_${Date.now()}_1`,
            title: "OpenAI Releases GPT-5 with Revolutionary Reasoning Capabilities",
            description: "The latest AI model shows unprecedented advances in logical reasoning and complex problem-solving, setting new benchmarks across multiple domains.",
            url: "https://techcrunch.com/artificial-intelligence",
            source: { name: "TechCrunch" },
            publishedAt: new Date(now - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop"
          },
          {
            id: `mock_${Date.now()}_2`,
            title: "Microsoft Announces New Developer Tools for AI Integration",
            description: "GitHub Copilot X introduces advanced code generation features designed specifically for enterprise developers and complex applications.",
            url: "https://techcrunch.com/microsoft-developer-tools",
            source: { name: "The Verge" },
            publishedAt: new Date(now - Math.random() * 4 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop"
          }
        ],
        [
          {
            id: `mock_${Date.now()}_3`,
            title: "React 19 Beta Released with Server Components",
            description: "The React team unveils major performance improvements and new rendering patterns that revolutionize full-stack development.",
            url: "https://react.dev/blog",
            source: { name: "React Blog" },
            publishedAt: new Date(now - Math.random() * 3 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop"
          },
          {
            id: `mock_${Date.now()}_4`,
            title: "Google Cloud Introduces New AI-Powered Development Platform",
            description: "Vertex AI Studio now supports advanced machine learning workflows designed for enterprise applications and complex data processing.",
            url: "https://cloud.google.com/blog",
            source: { name: "Google Cloud Blog" },
            publishedAt: new Date(now - Math.random() * 5 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=200&fit=crop"
          }
        ],
        [
          {
            id: `mock_${Date.now()}_5`,
            title: "Apple's Swift 6.0 Brings Memory Safety Features",
            description: "The latest Swift version focuses on enhanced security and performance optimizations, making iOS development more robust.",
            url: "https://developer.apple.com/swift",
            source: { name: "Apple Developer" },
            publishedAt: new Date(now - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=400&h=200&fit=crop"
          },
          {
            id: `mock_${Date.now()}_6`,
            title: "Kubernetes 1.31 Released with Enhanced Security",
            description: "New features include improved pod security standards and cluster management tools for better container orchestration.",
            url: "https://kubernetes.io/blog",
            source: { name: "CNCF" },
            publishedAt: new Date(now - Math.random() * 7 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=200&fit=crop"
          }
        ]
      ];
        return NextResponse.json({
        success: true,
        articles: mockArticles[mockSeed],
        source: 'mock',
        seed: seed,
        refresh: isManualRefresh
      });
    }    // Rotate through different queries and domains for variety
    const queryIndex = seed % TECH_QUERIES.length;
    const domainIndex = seed % DOMAINS.length;
    const searchQuery = TECH_QUERIES[queryIndex];
    const domains = DOMAINS[domainIndex];
    
    console.log(`🔍 Using query ${queryIndex + 1}/${TECH_QUERIES.length}: ${searchQuery.substring(0, 50)}...`);
    console.log(`🌐 Using domains: ${domains}`);

    // Fetch real news using NewsAPI with rotation
    const apiUrl = new URL('https://newsapi.org/v2/everything');
    apiUrl.searchParams.set('q', searchQuery);
    apiUrl.searchParams.set('domains', domains);    apiUrl.searchParams.set('language', 'en');
    apiUrl.searchParams.set('sortBy', 'publishedAt');
    apiUrl.searchParams.set('pageSize', '20');
    apiUrl.searchParams.set('page', Math.floor(seed / TECH_QUERIES.length) % 3 + 1); // Rotate pages too
    
    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${NEWS_API_KEY}`,
        'User-Agent': 'X-Ceed-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 NewsAPI returned ${data.articles?.length || 0} articles`);

    // Filter and format the articles
    const filteredArticles = data.articles
      .filter(article => 
        article.title &&
        article.description &&
        article.url &&
        !article.title.includes('[Removed]') &&
        !article.description.includes('[Removed]') &&
        article.source.name !== null
      )      .slice(0, 15)
      .map((article, index) => ({
        id: `news_${seed}_${index}`,
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage || `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80&sig=${seed}_${index}`
      }));

    console.log(`✅ Returning ${filteredArticles.length} fresh articles`);    return NextResponse.json({
      success: true,
      articles: filteredArticles,
      source: 'newsapi',
      query: searchQuery,
      domains: domains,
      seed: seed,
      refresh: isManualRefresh,
      queryIndex: queryIndex + 1,
      totalQueries: TECH_QUERIES.length
    });
  } catch (error) {
    console.error('💥 Error fetching tech news:', error);
    
    // Return fallback mock data on error, but make it dynamic
    const errorSeed = Math.floor(Date.now() / 1000) % 3;
    const fallbackArticles = [
      {
        id: `error_${Date.now()}_1`,
        title: "Tech News Service Temporarily Unavailable",
        description: "We're experiencing issues connecting to news sources. Our team is working to restore the service. Please try refreshing in a few minutes.",
        url: "#",
        source: { name: "X-Ceed System" },
        publishedAt: new Date().toISOString(),
        urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
      }
    ];
    
    return NextResponse.json({
      success: true,
      articles: fallbackArticles,
      source: 'fallback',
      error: error.message
    });
  }
}
