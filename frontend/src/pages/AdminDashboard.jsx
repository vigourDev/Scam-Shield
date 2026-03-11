import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getStats();
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, subtitle, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };

    return (
      <div className={`card border-l-4 ${colorClasses[color]}`}>
        <p className="text-xs md:text-sm font-semibold opacity-70">{title}</p>
        <p className="text-2xl md:text-4xl font-bold my-2">{value}</p>
        {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 text-sm md:text-base mt-1">Manage scams, users, and reports</p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      ) : stats && (
        <>
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 rounded-t-lg overflow-x-auto">
            <div className="flex gap-2 md:gap-8 px-3 md:px-6 min-w-max md:min-w-full">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 md:py-4 px-2 md:px-0 text-sm md:text-base font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3 md:py-4 px-2 md:px-0 text-sm md:text-base font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3 md:py-4 px-2 md:px-0 text-sm md:text-base font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Users
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Reports"
                  value={stats.reports.total}
                  subtitle={`${stats.reports.last7Days} in last 7 days`}
                  color="blue"
                />
                <StatCard
                  title="Pending Verification"
                  value={stats.reports.pending}
                  subtitle="Awaiting moderation"
                  color="yellow"
                />
                <StatCard
                  title="Verified Reports"
                  value={stats.reports.verified}
                  subtitle="Confirmed scams"
                  color="green"
                />
                <StatCard
                  title="Blacklisted IDs"
                  value={stats.identifiers.blacklisted}
                  subtitle="High-risk items"
                  color="red"
                />
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Users"
                  value={stats.users.total}
                  color="blue"
                />
                <StatCard
                  title="Banned Users"
                  value={stats.users.banned}
                  subtitle="Account restrictions"
                  color="red"
                />
                <StatCard
                  title="Total Identifiers"
                  value={stats.identifiers.total}
                  subtitle="Unique scam items"
                  color="green"
                />
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-lg md:text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <button className="btn-primary text-sm md:text-base">View Pending Reports</button>
                  <button className="btn-primary text-sm md:text-base">Manage Blacklist</button>
                  <button className="btn-danger text-sm md:text-base">Ban Malicious User</button>
                  <button className="btn-secondary text-sm md:text-base">View All Users</button>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="card">
              <h2 className="text-lg md:text-xl font-bold mb-4">Reports Management</h2>
              <div className="space-y-4">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm md:text-base">Pending Reports ({stats.reports.pending})</p>
                      <p className="text-xs md:text-sm text-gray-600">Reports awaiting verification</p>
                    </div>
                    <button className="btn-primary text-xs md:text-sm w-full md:w-auto">Review Now</button>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm md:text-base">Verified Reports ({stats.reports.verified})</p>
                      <p className="text-xs md:text-sm text-gray-600">Confirmed scam reports</p>
                    </div>
                    <button className="btn-secondary text-xs md:text-sm w-full md:w-auto">View All</button>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm md:text-base">Last 7 Days Activity</p>
                      <p className="text-xs md:text-sm text-gray-600">{stats.reports.last7Days} new reports</p>
                    </div>
                    <span className="text-xl md:text-2xl font-bold text-blue-600">{stats.reports.last7Days}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card">
              <h2 className="text-lg md:text-xl font-bold mb-4">User Management</h2>
              <div className="space-y-4">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm md:text-base">Total Users</p>
                      <p className="text-xl md:text-3xl font-bold text-blue-600 mt-2">{stats.users.total}</p>
                    </div>
                    <button className="btn-secondary text-xs md:text-sm w-full md:w-auto">View All Users</button>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm md:text-base">Banned Users ({stats.users.banned})</p>
                      <p className="text-xs md:text-sm text-gray-600">Restricted accounts</p>
                    </div>
                    <button className="btn-danger text-xs md:text-sm w-full md:w-auto">Manage Bans</button>
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <p className="font-semibold text-sm md:text-base">Active Contributors</p>
                      <p className="text-xs md:text-sm text-gray-600">Users who've submitted reports</p>
                    </div>
                    <button className="btn-secondary text-xs md:text-sm w-full md:w-auto">View Contributors</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p>
              <strong>Last updated:</strong> {new Date().toLocaleString()}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
