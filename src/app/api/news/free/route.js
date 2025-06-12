import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔄 Fetching real-time tech news...');
    
    // Try multiple free sources for real-time news
    const news = [];
    
    // 1. Hacker News API (Free, no key needed)
    try {
      const hackerNewsResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      const storyIds = await hackerNewsResponse.json();
      
      // Get first 5 stories
      for (let i = 0; i < Math.min(5, storyIds.length); i++) {
        try {
          const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`);
          const story = await storyResponse.json();
          
          if (story && story.title && story.url) {
            news.push({
              id: `hn_${story.id}`,
              title: story.title,
              description: `Posted by ${story.by || 'Anonymous'} • ${story.score || 0} points • ${story.descendants || 0} comments`,
              url: story.url,
              source: { name: "Hacker News" },
              publishedAt: new Date(story.time * 1000).toISOString(),
              urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
            });
          }
        } catch (error) {
          console.error('Error fetching HN story:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching Hacker News:', error);
    }

    // 2. Dev.to API (Free, no key needed)
    try {
      const devToResponse = await fetch('https://dev.to/api/articles?tag=javascript,react,programming,webdev&top=1&per_page=5');
      const articles = await devToResponse.json();
      
      articles.forEach((article, index) => {
        news.push({
          id: `dev_${article.id}`,
          title: article.title,
          description: article.description || `By ${article.user.name} • ${article.positive_reactions_count} reactions`,
          url: article.url,
          source: { name: "Dev.to" },
          publishedAt: article.published_at,
          urlToImage: article.cover_image || "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&q=80"
        });
      });
    } catch (error) {
      console.error('Error fetching Dev.to articles:', error);
    }

    // 3. GitHub Trending (using GitHub API - free)
    try {
      const githubResponse = await fetch('https://api.github.com/search/repositories?q=language:javascript+created:>2024-01-01&sort=stars&order=desc&per_page=3');
      const githubData = await githubResponse.json();
      
      githubData.items?.forEach((repo, index) => {
        news.push({
          id: `gh_${repo.id}`,
          title: `🔥 Trending: ${repo.name}`,
          description: repo.description || `⭐ ${repo.stargazers_count} stars • ${repo.language} • By ${repo.owner.login}`,
          url: repo.html_url,
          source: { name: "GitHub Trending" },
          publishedAt: repo.created_at,
          urlToImage: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&h=200&fit=crop&q=80"
        });
      });
    } catch (error) {
      console.error('Error fetching GitHub trending:', error);
    }

    // 4. Reddit Programming (using RSS - no key needed)
    try {
      const redditResponse = await fetch('https://www.reddit.com/r/programming/hot.json?limit=3');
      const redditData = await redditResponse.json();
      
      redditData.data?.children?.forEach((post, index) => {
        const data = post.data;
        news.push({
          id: `reddit_${data.id}`,
          title: data.title,
          description: `👥 ${data.ups} upvotes • 💬 ${data.num_comments} comments • r/programming`,
          url: data.url.startsWith('http') ? data.url : `https://reddit.com${data.permalink}`,
          source: { name: "r/programming" },
          publishedAt: new Date(data.created_utc * 1000).toISOString(),
          urlToImage: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop&q=80"
        });
      });
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
    }

    // Sort by publication date (newest first)
    news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // If we got some real news, return it
    if (news.length > 0) {
      console.log(`✅ Fetched ${news.length} real-time articles from multiple sources`);
      return NextResponse.json({
        success: true,
        articles: news.slice(0, 15) // Limit to 15 articles
      });
    }

    // Fallback to mock data if all sources fail
    console.log('⚠️ All news sources failed, using fallback data');
    return NextResponse.json({
      success: true,
      articles: [
        {
          id: 1,
          title: "Real-Time Tech News Currently Unavailable",
          description: "We're working to restore the latest technology news feeds. The system will retry automatically in 5 minutes.",
          url: "#",
          source: { name: "X-Ceed System" },
          publishedAt: new Date().toISOString(),
          urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
        }
      ]
    });

  } catch (error) {
    console.error('💥 Error fetching real-time tech news:', error);
    
    return NextResponse.json({
      success: true,
      articles: [
        {
          id: 1,
          title: "News Service Temporarily Unavailable",
          description: "Unable to fetch latest tech news at this time. Please try refreshing in a few moments.",
          url: "#",
          source: { name: "X-Ceed" },
          publishedAt: new Date().toISOString(),
          urlToImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
        }
      ]
    });
  }
}
