import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Using NewsAPI for real tech news - you'll need to sign up for a free API key
    // For now, we'll use a free RSS-to-JSON service to get tech news
    
    // You can get a free API key from https://newsapi.org/
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    
    if (!NEWS_API_KEY) {
      // Fallback to mock data if no API key is provided
      return NextResponse.json({
        success: true,
        articles: [
          {
            id: 1,
            title: "OpenAI Releases GPT-5 with Revolutionary Reasoning Capabilities",
            description: "The latest AI model shows unprecedented advances in logical reasoning and complex problem-solving, setting new benchmarks across multiple domains.",
            url: "https://techcrunch.com/artificial-intelligence",
            source: { name: "TechCrunch" },
            publishedAt: new Date().toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop"
          },
          {
            id: 2,
            title: "Microsoft Announces New Developer Tools for AI Integration",
            description: "GitHub Copilot X introduces advanced code generation features designed specifically for enterprise developers and complex applications.",
            url: "https://techcrunch.com/microsoft-developer-tools",
            source: { name: "The Verge" },
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop"
          },
          {
            id: 3,
            title: "React 19 Beta Released with Server Components",
            description: "The React team unveils major performance improvements and new rendering patterns that revolutionize full-stack development.",
            url: "https://react.dev/blog",
            source: { name: "React Blog" },
            publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop"
          },
          {
            id: 4,
            title: "Google Cloud Introduces New AI-Powered Development Platform",
            description: "Vertex AI Studio now supports advanced machine learning workflows designed for enterprise applications and complex data processing.",
            url: "https://cloud.google.com/blog",
            source: { name: "Google Cloud Blog" },
            publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=200&fit=crop"
          },
          {
            id: 5,
            title: "Apple's Swift 6.0 Brings Memory Safety Features",
            description: "The latest Swift version focuses on enhanced security and performance optimizations, making iOS development more robust.",
            url: "https://developer.apple.com/swift",
            source: { name: "Apple Developer" },
            publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=400&h=200&fit=crop"
          },
          {
            id: 6,
            title: "Kubernetes 1.31 Released with Enhanced Security",
            description: "New features include improved pod security standards and cluster management tools for better container orchestration.",
            url: "https://kubernetes.io/blog",
            source: { name: "CNCF" },
            publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=200&fit=crop"
          },
          {
            id: 7,
            title: "TypeScript 5.5 Introduces New Type System Features",
            description: "Enhanced type inference and new utility types make TypeScript development more powerful and developer-friendly.",
            url: "https://devblogs.microsoft.com/typescript",
            source: { name: "TypeScript Blog" },
            publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"
          },
          {
            id: 8,
            title: "AWS Announces New Serverless Computing Enhancements",
            description: "Lambda functions now support enhanced cold start optimization and improved integration with other AWS services.",
            url: "https://aws.amazon.com/blogs",
            source: { name: "AWS Blog" },
            publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
            urlToImage: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=400&h=200&fit=crop"
          }
        ]
      });
    }

    // Fetch real news using NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=technology OR programming OR "artificial intelligence" OR "machine learning" OR "web development" OR "software engineering"&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`,
      {
        headers: {
          'User-Agent': 'X-Ceed-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();

    // Filter and format the articles
    const filteredArticles = data.articles
      .filter(article => 
        article.title &&
        article.description &&
        article.url &&
        !article.title.includes('[Removed]') &&
        !article.description.includes('[Removed]')
      )
      .slice(0, 15)
      .map((article, index) => ({
        id: index + 1,
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage || `https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80`
      }));

    return NextResponse.json({
      success: true,
      articles: filteredArticles
    });

  } catch (error) {
    console.error('Error fetching tech news:', error);
    
    // Return fallback mock data on error
    return NextResponse.json({
      success: true,
      articles: [
        {
          id: 1,
          title: "Tech News Currently Unavailable",
          description: "We're working to restore the latest technology news. Please check back soon for updates on AI, development, and tech trends.",
          url: "#",
          source: { name: "X-Ceed" },
          publishedAt: new Date().toISOString(),
          urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
        }
      ]
    });
  }
}
