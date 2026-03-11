import { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';

export default function TrendingPage() {
  const [trending, setTrending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await reportAPI.getTrending(30);
        setTrending(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching trending scams');
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const getCategoryColor = (category) => {
    const colors = {
      phishing: 'bg-red-100 text-red-800',
      impersonation: 'bg-orange-100 text-orange-800',
      ponzi: 'bg-purple-100 text-purple-800',
      fake_investment: 'bg-blue-100 text-blue-800',
      romance: 'bg-pink-100 text-pink-800',
      money_laundering: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="card">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Trending Scams</h1>
        <p className="text-gray-600 text-sm md:text-base">Last 30 days activity</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="card text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading trending data...</p>
        </div>
      )}

      {trending && !loading && (
        <>
          {/* Top Categories */}
          <div className="card">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">🏆 Top Scam Categories</h2>
            <div className="space-y-3 md:space-y-4">
              {trending.topCategories.map((category, idx) => (
                <div key={idx} className="flex items-center gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className={`inline-block ${getCategoryColor(category._id)} px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold`}>
                        {category._id.replace(/_/g, ' ')}
                      </span>
                      <span className="text-lg md:text-2xl font-bold text-gray-900 flex-shrink-0">{category.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${(category.count / Math.max(...trending.topCategories.map(c => c.count))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Types */}
          {trending.trendingTypes.length > 0 && (
            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">📱 Trending Scam Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {trending.trendingTypes.map((type, idx) => {
                  const categories = type.categories || [];
                  const topCategory = categories.reduce((a, b) =>
                    (categories.filter(v => v === a).length >
                      categories.filter(v => v === b).length ? a : b), categories[0]);

                  return (
                    <div key={idx} className="p-3 md:p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                      <div className="flex items-center justify-between mb-2 md:mb-3 gap-2">
                        <h3 className="font-bold text-sm md:text-base capitalize flex-1 break-words">{type._id}</h3>
                        <span className="text-lg md:text-2xl font-bold text-blue-600 flex-shrink-0">{type.count}</span>
                      </div>
                      {topCategory && (
                        <span className={`inline-block ${getCategoryColor(topCategory)} px-2 py-1 rounded text-xs font-semibold`}>
                          {topCategory.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-gray-600 text-xs md:text-sm mb-2">Total Reports (30 days)</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">
                {trending.trendingTypes.reduce((sum, t) => sum + t.count, 0)}
              </p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-xs md:text-sm mb-2">Active Scam Types</p>
              <p className="text-2xl md:text-3xl font-bold text-orange-600">{trending.trendingTypes.length}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-xs md:text-sm mb-2">Top Category</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {trending.topCategories[0]?._id.replace(/_/g, ' ') || 'N/A'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
