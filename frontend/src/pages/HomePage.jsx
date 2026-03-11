import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState('telegram');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?type=${searchType}&value=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 md:p-12 text-white">
        <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 leading-tight">Protect Yourself from Scams</h1>
        <p className="text-base md:text-xl mb-6 md:mb-8 opacity-90">
          Check phone numbers, Telegram accounts, websites, emails, crypto wallets, and more
          against our database of known scams.
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-3 rounded-lg bg-white text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm md:text-base"
            >
              <option value="telegram">Telegram</option>
              <option value="phone">Phone Number</option>
              <option value="email">Email</option>
              <option value="website">Website</option>
              <option value="crypto">Crypto Wallet</option>
              <option value="card_bin">Card BIN</option>
            </select>
            <input
              type="text"
              placeholder={`Enter ${searchType}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm md:text-base bg-white text-gray-900"
            />
            <button
              type="submit"
              className="btn-primary bg-white text-blue-600 hover:bg-gray-100 w-full md:w-auto whitespace-nowrap"
            >
              Check Now
            </button>
          </div>
        </form>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="card">
          <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-2">🔍 Universal Checker</h3>
          <p className="text-gray-600">
            Check phone numbers, Telegram usernames, websites, emails, crypto wallets, and card BINs
            against our comprehensive scam database.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-2">📊 Risk Scoring</h3>
          <p className="text-gray-600">
            Get instant risk scores (0-100) and detailed information about each identifier,
            including number of reports and linked scams.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-2">👥 Community Reports</h3>
          <p className="text-gray-600">
            Help the community by reporting new scams. Our moderators verify reports and update
            risk scores in real-time.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-2">🕸️ Network Intelligence</h3>
          <p className="text-gray-600">
            See connected scam networks. Identifiers are linked together when they appear in
            the same scam reports.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-2">📈 Trending Scams</h3>
          <p className="text-gray-600">
            Stay informed about the latest and most common scams. View trending scam types,
            categories, and patterns.
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg md:text-xl font-bold text-blue-600 mb-2">⚡ Real-time Alerts</h3>
          <p className="text-gray-600">
            Get instant notifications when new scams are reported, blacklisted, or verified.
            Stay ahead of threats.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-6">How ScamShield Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-0">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">1</div>
            <h3 className="font-semibold mb-1 text-sm md:text-base">Search</h3>
            <p className="text-xs md:text-sm text-gray-600">Enter any identifier to check</p>
          </div>
          <div className="text-center p-3 md:p-0">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">2</div>
            <h3 className="font-semibold mb-1 text-sm md:text-base">Analyze</h3>
            <p className="text-xs md:text-sm text-gray-600">Get risk score and reports</p>
          </div>
          <div className="text-center p-3 md:p-0">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">3</div>
            <h3 className="font-semibold mb-1 text-sm md:text-base">Report</h3>
            <p className="text-xs md:text-sm text-gray-600">Help by reporting scams</p>
          </div>
          <div className="text-center p-3 md:p-0">
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">4</div>
            <h3 className="font-semibold mb-1 text-sm md:text-base">Protect</h3>
            <p className="text-xs md:text-sm text-gray-600">Community gets safer</p>
          </div>
        </div>
      </div>

      {/* Risk Score Legend */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-6">Risk Score Levels</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div className="p-4 border-l-4 border-green-500 text-sm">
            <div className="risk-low mb-2">Safe (0-25)</div>
            <p className="text-gray-600">No known reports or low risk</p>
          </div>
          <div className="p-4 border-l-4 border-yellow-500 text-sm">
            <div className="risk-medium mb-2">Suspicious (26-50)</div>
            <p className="text-gray-600">Few reports, needs verification</p>
          </div>
          <div className="p-4 border-l-4 border-orange-500 text-sm">
            <div className="risk-medium mb-2">Dangerous (51-75)</div>
            <p className="text-gray-600">Multiple confirmed reports</p>
          </div>
          <div className="p-4 border-l-4 border-red-500 text-sm">
            <div className="risk-high mb-2">Confirmed Scam (76-100)</div>
            <p className="text-gray-600">High confidence scam detected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
