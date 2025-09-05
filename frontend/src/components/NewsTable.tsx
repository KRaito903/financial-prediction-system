import React from 'react';
import { ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  text: string;
  url: string;
  publishedTime: string;
  sentimentScore: number;
}

interface NewsTableProps {
  news: NewsItem[];
  loading: boolean;
}

const getSentimentColor = (score: number): string => {
  // Score ranges from -100 to 100, normalize to 0-1
  const normalized = (score + 100) / 200;
  
  // Create gradient from red (0) to yellow (0.5) to green (1)
  if (normalized <= 0.5) {
    // Red to Yellow: interpolate between red and yellow
    const factor = normalized * 2;
    const red = 255;
    const green = Math.round(255 * factor);
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // Yellow to Green: interpolate between yellow and green
    const factor = (normalized - 0.5) * 2;
    const red = Math.round(255 * (1 - factor));
    const green = 255;
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }
};

const getFirstSentence = (text: string): string => {
  const sentences = text.split(/[.!?]+/);
  return sentences[0]?.trim() + (sentences[0] ? '.' : '');
};

const NewsTable: React.FC<NewsTableProps> = ({ news, loading }) => {
  if (loading) {
    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Market News</h3>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-gray-600">Loading news...</span>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market News</h3>
        <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No news available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Market News</h3>
        <span className="text-sm text-gray-500">{news.length} articles</span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {news.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              style={{
                backgroundColor: getSentimentColor(item.sentimentScore) + '10', // Add opacity
                borderColor: getSentimentColor(item.sentimentScore) + '30'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-2 overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis'
                  }}>
                    {getFirstSentence(item.text)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        {item.publishedTime}
                      </span>
                      <span 
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: getSentimentColor(item.sentimentScore) + '20',
                          color: getSentimentColor(item.sentimentScore)
                        }}
                      >
                        Sentiment: {item.sentimentScore > 0 ? '+' : ''}{item.sentimentScore}
                      </span>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm">Read more</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTable;