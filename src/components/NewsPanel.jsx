'use client';

import { useState, useEffect } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  Loader2, 
  RefreshCw,
  TrendingUp
} from 'lucide-react';

export default function NewsPanel() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);  const [freshContentLoaded, setFreshContentLoaded] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [currentSeed, setCurrentSeed] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Storage keys for persistence across page navigation
  const STORAGE_KEYS = {
    news: 'xceed_news_articles',
    lastUpdated: 'xceed_news_last_updated',
    refreshCount: 'xceed_news_refresh_count',
    currentSeed: 'xceed_news_current_seed'
  };

  // Load persisted state on component mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const persistedNews = localStorage.getItem(STORAGE_KEYS.news);
        const persistedLastUpdated = localStorage.getItem(STORAGE_KEYS.lastUpdated);
        const persistedRefreshCount = localStorage.getItem(STORAGE_KEYS.refreshCount);
        const persistedCurrentSeed = localStorage.getItem(STORAGE_KEYS.currentSeed);

        if (persistedNews) {
          const parsedNews = JSON.parse(persistedNews);
          const lastUpdatedDate = persistedLastUpdated ? new Date(persistedLastUpdated) : null;
          
          // Check if persisted news is still fresh (less than 30 minutes old)
          const isStillFresh = lastUpdatedDate && (Date.now() - lastUpdatedDate.getTime()) < 30 * 60 * 1000;
          
          if (isStillFresh && parsedNews.length > 0) {
            console.log('📦 Loading persisted news state from localStorage');
            setNews(parsedNews);
            setLastUpdated(lastUpdatedDate);
            setRefreshCount(parseInt(persistedRefreshCount) || 0);
            setCurrentSeed(parseInt(persistedCurrentSeed) || null);
            setLoading(false);
            setIsInitialized(true);
            
            console.log(`✅ Restored ${parsedNews.length} articles from storage (${Math.round((Date.now() - lastUpdatedDate.getTime()) / 1000 / 60)} minutes old)`);
            return true; // Skip initial fetch
          }
        }
      } catch (error) {
        console.error('❌ Error loading persisted news state:', error);
      }
      return false; // Proceed with initial fetch
    };

    const shouldSkipInitialFetch = loadPersistedState();
    setIsInitialized(true);
    
    // Only fetch if we didn't load from storage
    if (!shouldSkipInitialFetch) {
      fetchNews();
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && news.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.news, JSON.stringify(news));
        localStorage.setItem(STORAGE_KEYS.lastUpdated, lastUpdated?.toISOString() || '');
        localStorage.setItem(STORAGE_KEYS.refreshCount, refreshCount.toString());
        localStorage.setItem(STORAGE_KEYS.currentSeed, currentSeed?.toString() || '');
        console.log('💾 News state persisted to localStorage');
      } catch (error) {
        console.error('❌ Error persisting news state:', error);
      }
    }
  }, [news, lastUpdated, refreshCount, currentSeed, isInitialized]);
  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }    try {
      console.log('🔄 Fetching FRESH tech news from NewsAPI...');
      
      // Create a unique seed for each manual refresh to ensure different content
      const refreshSeed = isRefresh ? Date.now() + Math.random() * 1000 : Math.floor(Date.now() / (5 * 60 * 1000));
      const apiUrl = `/api/news?seed=${Math.floor(refreshSeed)}&refresh=${isRefresh ? 'true' : 'false'}`;
      
      console.log(`🎲 Using refresh seed: ${Math.floor(refreshSeed)} (manual: ${isRefresh})`);
      
      // Store current seed to detect content changes
      setCurrentSeed(Math.floor(refreshSeed));
      
      // Use the premium NewsAPI endpoint since we have a real API key
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('⚠️ NewsAPI failed, falling back to free sources...');
        // Fallback to free sources if NewsAPI fails
        const fallbackResponse = await fetch(`/api/news/free?seed=${refreshSeed}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Both APIs failed! NewsAPI: ${response.status}, Free: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log('📰 Using fallback news sources:', fallbackData);
        
        if (fallbackData.success && fallbackData.articles) {
          const formattedArticles = fallbackData.articles.map(article => ({
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
          console.log(`✅ Fallback news updated: ${formattedArticles.length} articles from free sources`);
        }
        return;
      }

      const data = await response.json();
      console.log('📰 Premium NewsAPI response:', data);
      
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
          // Show fresh content indicator for manual refresh
        if (isRefresh) {
          setFreshContentLoaded(true);
          setRefreshCount(prev => prev + 1);
          setTimeout(() => setFreshContentLoaded(false), 4000); // Show longer for better UX
        }
        
        // Log what type of content we got
        const sourceInfo = data.source || 'unknown';
        const queryInfo = data.query ? ` (Query: ${data.query.substring(0, 50)}...)` : '';
        const seedInfo = data.seed ? ` [Seed: ${data.seed}]` : '';
        console.log(`✅ FRESH NewsAPI updated successfully: ${formattedArticles.length} articles from ${sourceInfo}${queryInfo}${seedInfo}`);
        
        // Show user feedback for manual refresh
        if (isRefresh) {
          console.log(`🔄 Manual refresh #${refreshCount + 1} completed - showing fresh content!`);
        }
      } else {
        throw new Error('Invalid response format from NewsAPI');
      }
    } catch (error) {
      console.error('❌ Error fetching real-time news:', error);
      
      // Final fallback to basic tech news if both APIs fail
      setNews([
        {
          id: `fallback_${Date.now()}`,
          title: "Real-Time News Service Temporarily Unavailable",
          description: "We're experiencing issues connecting to news sources. Please try refreshing in a few minutes for the latest tech updates.",
          url: "#",
          source: "X-Ceed System",
          publishedAt: new Date().toISOString(),
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&q=80"
        }
      ]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }  };

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
  };  const handleRefresh = () => {
    console.log(`🔄 Manual refresh #${refreshCount + 1} triggered - fetching fresh articles...`);
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
    <div className="bg-card border border-border rounded-lg shadow-md h-full flex flex-col">      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center text-foreground">
            <Newspaper className="h-5 w-5 mr-2 text-primary" />            Tech News
            <TrendingUp className="h-4 w-4 ml-2 text-green-500" />            {freshContentLoaded && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                Updated!
              </span>
            )}
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 hover:bg-muted rounded-full transition-colors ${refreshing ? 'animate-spin' : 'hover:scale-110'}`}
            title={refreshing ? "Fetching fresh articles..." : "Get fresh articles"}
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>        </div>
      </div>      {/* News Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 space-y-4">
          {news.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer block"
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
              </div>
              {/* Article Content */}
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
            </a>
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
