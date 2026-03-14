import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { checkAPI } from '../services/api';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialHasQuery = Boolean(searchParams.get('value'));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState(searchParams.get('value') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'telegram');
  const [showSearchForm, setShowSearchForm] = useState(!initialHasQuery);

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
      setShowSearchForm(false);
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
      {!showSearchForm && result && (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Viewing analysis for <strong>{result.identifier?.value}</strong>
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowSearchForm(true)}
          >
            Analyze Another
          </button>
        </div>
      )}

      {/* Search Form */}
      {showSearchForm && (
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
      )}

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-semibold">Scanning in real-time...</p>
          <p className="mt-1 text-gray-400 text-sm">
            Querying 15+ sources: Reddit, GitHub, DuckDuckGo, URLscan.io, PhishTank, ThreatFox, StopForumSpam, EmailRep, ChainAbuse &amp; more
          </p>
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
                    ? new Date(result.identifier.firstReported).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Last Reported</p>
                <p className="text-sm font-semibold">
                  {result.identifier.lastReported
                    ? new Date(result.identifier.lastReported).toLocaleDateString()
                    : 'N/A'}
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

              {/* Fraud Risk Profile for BIN */}
              {result.cardDetails.fraudRiskProfile && (
                <div className="mt-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    result.cardDetails.fraudRiskProfile.riskLevel === 'High'
                      ? 'bg-red-50 border-red-300'
                      : result.cardDetails.fraudRiskProfile.riskLevel === 'Medium'
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-green-50 border-green-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm uppercase tracking-wide">
                        🔍 Fraud Risk Assessment
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        result.cardDetails.fraudRiskProfile.riskLevel === 'High'
                          ? 'bg-red-200 text-red-800'
                          : result.cardDetails.fraudRiskProfile.riskLevel === 'Medium'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                      }`}>
                        {result.cardDetails.fraudRiskProfile.riskLevel} Risk
                      </span>
                    </div>
                    {result.cardDetails.fraudRiskProfile.inFraudDatabase && (
                      <p className="text-red-700 font-semibold text-sm mb-2">
                        ⚠️ This BIN is in our fraud database
                      </p>
                    )}
                    {result.cardDetails.fraudRiskProfile.factors?.map((f, i) => (
                      <div key={i} className="mt-2 p-2 bg-white bg-opacity-60 rounded">
                        <p className={`text-xs font-bold uppercase ${
                          f.severity === 'high' ? 'text-red-700' : f.severity === 'medium' ? 'text-yellow-700' : 'text-gray-600'
                        }`}>
                          {f.severity === 'high' ? '🔴' : f.severity === 'medium' ? '🟡' : '⚪'} {f.factor}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">{f.detail}</p>
                      </div>
                    ))}
                    <p className="text-xs text-gray-600 mt-3 italic border-t pt-2">
                      {result.cardDetails.fraudRiskProfile.advice}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phone Details */}
          {result.phoneDetails && (
            <div className="card">
              <h3 className="text-xl font-bold mb-4">📞 Phone Origin</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Number</p>
                  <p className="text-md font-bold text-blue-900 break-all">{result.phoneDetails.normalized}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Country Code</p>
                  <p className="text-md font-bold text-green-900">{result.phoneDetails.countryCode}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Country / Origin</p>
                  <p className="text-md font-bold text-orange-900">{result.phoneDetails.country}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Region</p>
                  <p className="text-md font-bold text-purple-900">{result.phoneDetails.region || 'Unknown'}</p>
                </div>
              </div>
              {result.phoneDetails.localNumber && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-600 text-xs font-semibold uppercase">Local Number</p>
                  <p className="text-md font-bold text-gray-900">{result.phoneDetails.localNumber}</p>
                </div>
              )}
            </div>
          )}

          {/* Live Intelligence — real-time multi-source scan */}
          {result.liveIntelligence && (
            <div className="card">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-xl font-bold">🌐 Live Web Intelligence</h3>
                <div className="flex flex-col items-end gap-1">
                  {result.liveIntelligence.fromCache && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">cached</span>
                  )}
                  {result.liveIntelligence.searchedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(result.liveIntelligence.searchedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">Reddit</span>
                <span className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full">GitHub</span>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">DuckDuckGo</span>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Google CSE</span>
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">URLscan.io</span>
                <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">PhishTank</span>
                <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">ThreatFox</span>
                <span className="text-xs bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-full">StopForumSpam</span>
                <span className="text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">EmailRep</span>
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">ChainAbuse</span>
                <span className="text-xs bg-lime-50 text-lime-700 border border-lime-200 px-2 py-0.5 rounded-full">VirusTotal</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">IPQS</span>
                <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">Spamhaus</span>
                <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">AbuseIPDB</span>
                <span className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">ScamAdviser</span>
                <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">HIBP</span>
              </div>

              {!result.liveIntelligence.found ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  No scam mentions found across 15+ intelligence sources including Reddit, GitHub, DuckDuckGo, URLscan.io, PhishTank, ThreatFox, StopForumSpam &amp; more.
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    {result.liveIntelligence.mentions} result(s) found across live sources
                    {result.liveIntelligence.riskBoost > 0 && (
                      <span className="ml-2 text-orange-700 font-semibold">
                        +{result.liveIntelligence.riskBoost} pts added to risk score
                      </span>
                    )}
                    {result.liveIntelligence.flagged && (
                      <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        ⚠️ Flagged as scam
                      </span>
                    )}
                  </p>
                  <div className="space-y-3">
                    {result.liveIntelligence.sources.map((src, idx) => {
                      const platformBadge =
                        src.platform?.includes('Reddit') ? 'bg-orange-100 text-orange-800' :
                        src.platform?.includes('GitHub') ? 'bg-gray-200 text-gray-800' :
                        src.platform?.includes('URLscan') ? 'bg-purple-100 text-purple-800' :
                        src.platform?.includes('PhishTank') ? 'bg-red-100 text-red-800' :
                        src.platform?.includes('ThreatFox') ? 'bg-yellow-100 text-yellow-800' :
                        src.platform?.includes('StopForumSpam') ? 'bg-pink-100 text-pink-800' :
                        src.platform?.includes('EmailRep') ? 'bg-cyan-100 text-cyan-800' :
                        src.platform?.includes('ChainAbuse') || src.platform?.includes('BitcoinAbuse') ? 'bg-amber-100 text-amber-800' :
                        src.platform?.includes('VirusTotal') ? 'bg-lime-100 text-lime-800' :
                        src.platform?.includes('IPQS') || src.platform?.includes('IPQuality') ? 'bg-indigo-100 text-indigo-800' :
                        src.platform?.includes('Spamhaus') ? 'bg-teal-100 text-teal-800' :
                        src.platform?.includes('AbuseIPDB') ? 'bg-rose-100 text-rose-800' :
                        src.platform?.includes('ScamAdviser') ? 'bg-violet-100 text-violet-800' :
                        src.platform?.includes('HaveIBeenPwned') || src.platform?.includes('HIBP') ? 'bg-sky-100 text-sky-800' :
                        'bg-blue-100 text-blue-800';
                      return (
                        <div key={idx} className={`p-3 rounded-lg border ${
                          src.flagged ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${platformBadge}`}>
                                  {src.platform === 'Reddit' ? `Reddit r/${src.subreddit}` :
                                   src.platform === 'GitHub' ? `GitHub: ${src.repoName || ''}` :
                                   src.platform}
                                </span>
                                {src.flagged && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                                    ⚠️ Scam flagged
                                  </span>
                                )}
                                {src.scanScore != null && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    Score: {src.scanScore}/100
                                  </span>
                                )}
                              </div>
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-blue-700 hover:underline line-clamp-2"
                              >
                                {src.title}
                              </a>
                              {src.snippet && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-3">{src.snippet}</p>
                              )}
                              {src.screenshot && (
                                <a href={src.screenshot} target="_blank" rel="noopener noreferrer"
                                   className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                                  📸 View URLscan screenshot
                                </a>
                              )}
                            </div>
                            {src.date && (
                              <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                                {new Date(src.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
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
