'use client';

import { useState, useEffect } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  Loader2, 
  RefreshCw,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function NewsPanel() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Mock news data for now - later we'll replace with real API
  const mockNews = [];
  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🔄 Fetching tech news...');
      
      const response = await fetch('/api/news', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📰 News API response:', data);
      
      if (data.success && data.articles) {
        // Map the articles to match our component structure
        const formattedArticles = data.articles.map(article => ({
          id: article.id,
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source?.name || article.source || 'Unknown',
          publishedAt: article.publishedAt,
          image: article.urlToImage || "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
        }));
        
        setNews(formattedArticles);
        setLastUpdated(new Date());
        console.log('✅ News updated successfully:', formattedArticles.length, 'articles');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching news:', error);
      
      // Fallback to some basic tech news if API fails
      setNews([
        {
          id: 1,
          title: "Stay Updated with Latest Tech News",
          description: "We're working to bring you the latest technology news and updates. Check back soon for fresh content.",
          url: "#",
          source: "X-Ceed",
          publishedAt: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
        }
      ]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNews();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - publishedDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleRefresh = () => {
    fetchNews(true);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-md h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center text-foreground">
              <Newspaper className="h-5 w-5 mr-2 text-primary" />
              Tech News
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading latest tech news...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Newspaper className="h-5 w-5 mr-2 text-primary" />
            Tech News
            <TrendingUp className="h-4 w-4 ml-2 text-green-500" />
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            title="Refresh news"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {lastUpdated && (
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {news.map((article) => (
            <div
              key={article.id}
              className="group border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => window.open(article.url, '_blank')}
            >
              {/* Article Image */}
              <div className="mb-3">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-32 object-cover rounded-md"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x200/6b7280/ffffff?text=Tech+News";
                  }}
                />
              </div>              {/* Article Content */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors leading-tight overflow-hidden" 
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      textOverflow: 'ellipsis'
                    }}>
                  {article.title}
                </h4>
                
                <p className="text-xs text-muted-foreground leading-relaxed overflow-hidden" 
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 3,
                     WebkitBoxOrient: 'vertical',
                     textOverflow: 'ellipsis'
                   }}>
                  {article.description}
                </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-primary">{article.source}</span>
                  <div className="flex items-center space-x-2">
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                    <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          Auto-refreshes every 5 minutes
        </p>
      </div>
    </div>
  );
}
