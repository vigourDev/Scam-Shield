import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { checkAPI } from '../services/api';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState(searchParams.get('value') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'telegram');

  useEffect(() => {
    if (searchParams.get('value')) {
      performSearch(searchParams.get('type'), searchParams.get('value'));
    }
  }, [searchParams]);

  const performSearch = async (type, value) => {
    setLoading(true);
    setError('');
    try {
      const response = await checkAPI.check(type, value);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error checking identifier');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      performSearch(searchType, searchValue);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskClass = (score) => {
    if (score <= 25) return 'risk-low';
    if (score <= 50) return 'risk-medium';
    if (score <= 75) return 'risk-medium';
    return 'risk-high';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Check Scam Risk</h2>
        <div className="flex flex-col md:flex-row gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="input-field text-sm md:text-base"
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
            className="input-field flex-1 text-sm md:text-base"
          />
          <button type="submit" className="btn-primary w-full md:w-auto whitespace-nowrap" disabled={loading}>
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking identifier...</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 md:space-y-6">
          {/* Risk Score Card */}
          <div className="card">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 break-words">
                  {result.identifier.value}
                </h3>
                <p className="text-gray-600 capitalize text-sm md:text-base">Type: {result.identifier.type}</p>
              </div>
              <div className="text-left md:text-right">
                <div className={`text-3xl md:text-4xl font-bold ${getRiskColor(result.identifier.riskScore)}`}>
                  {result.identifier.riskScore}
                </div>
                <span className={`inline-block mt-2 ${getRiskClass(result.identifier.riskScore)}`}>
                  {result.identifier.riskLevel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Reports</p>
                <p className="text-xl md:text-2xl font-bold">{result.identifier.reportsCount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Blacklisted</p>
                <p className="text-xl md:text-2xl font-bold">
                  {result.identifier.isBlacklisted ? '✓' : '✗'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">First Reported</p>
                <p className="text-sm font-semibold">
                  {result.identifier.firstReported
                    ? new Date(result.identifier.firstReported).tolocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Last Reported</p>
                <p className="text-sm font-semibold">
                  {new Date(result.identifier.lastReported).toLocaleDateString()}
                </p>
              </div>
            </div>

            {result.identifier.suspiciousPatterns?.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-gray-600 text-sm mb-2">⚠️ Suspicious Patterns</p>
                <div className="flex flex-wrap gap-2">
                  {result.identifier.suspiciousPatterns.map((pattern, idx) => (
                    <span key={idx} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      {pattern.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Details for BIN Lookup */}
          {result.cardDetails && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4">💳 Card Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {result.cardDetails.scheme && result.cardDetails.scheme !== 'UNKNOWN' && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase">Scheme</p>
                    <p className="text-md md:text-lg font-bold text-blue-900 capitalize">
                      {result.cardDetails.scheme}
                    </p>
                  </div>
                )}
                {result.cardDetails.type && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase">Type</p>
                    <p className="text-md md:text-lg font-bold text-purple-900 capitalize">
                      {result.cardDetails.type}
                    </p>
                  </div>
                )}
                {result.cardDetails.brand && (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase">Brand</p>
                    <p className="text-md md:text-lg font-bold text-indigo-900">
                      {result.cardDetails.brand}
                    </p>
                  </div>
                )}
                {result.cardDetails.bank?.name && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 md:col-span-2">
                    <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase">Bank / Issuer</p>
                    <p className="text-md md:text-lg font-bold text-green-900">
                      {result.cardDetails.bank.name}
                    </p>
                  </div>
                )}
                {result.cardDetails.country && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-gray-600 text-xs md:text-sm font-semibold uppercase">Country</p>
                    <div>
                      <p className="text-md md:text-lg font-bold text-orange-900">
                        {result.cardDetails.country.name}
                      </p>
                      {result.cardDetails.country.currency && (
                        <p className="text-xs text-gray-600 mt-1">
                          Currency: {result.cardDetails.country.currency}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scam Network */}
          {result.linkedIdentifiers?.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4">🕸️ Linked Scam Network</h3>
              <div className="space-y-3">
                {result.linkedIdentifiers.map((link, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{link.value}</p>
                        <p className="text-sm text-gray-600 capitalize">{link.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Connection Strength</p>
                        <p className="text-lg font-bold">{Math.round(link.strength)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Reports */}
          {result.reports?.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4">📋 Recent Reports ({result.reports.length})</h3>
              <div className="space-y-3">
                {result.reports.map((report, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold mb-2">
                          {report.category.replace(/_/g, ' ')}
                        </span>
                        <p className="text-sm text-gray-600">
                          Reported by: <strong>{report.reporter}</strong>
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-700">{report.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.reports?.length === 0 && (
            <div className="card">
              <p className="text-gray-600 text-center">
                No verified reports for this identifier yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
