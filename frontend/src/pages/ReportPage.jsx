import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportAPI } from '../services/api';

export default function ReportPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'telegram',
    value: '',
    category: 'phishing',
    description: '',
    amountLost: '',
    currency: 'USD',
    scamDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await reportAPI.submit({
        ...formData,
        amountLost: formData.amountLost ? parseFloat(formData.amountLost) : null
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0">
      <div className="card">
        <h2 className="text-xl md:text-2xl font-bold mb-2">Report a Scam</h2>
        <p className="text-gray-600 mb-6 text-sm md:text-base">
          Help protect the community by reporting scams you've encountered.
          All reports are verified by our moderation team.
        </p>

        {success && (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
            ✓ Report submitted successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            ✗ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Identifier Type & Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Identifier Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="telegram">Telegram Username</option>
                <option value="phone">Phone Number</option>
                <option value="email">Email Address</option>
                <option value="website">Website</option>
                <option value="crypto">Crypto Wallet</option>
                <option value="card_bin">Card BIN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Value *
              </label>
              <input
                type="text"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder={`Enter ${formData.type}...`}
                required
                className="input-field"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Scam Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="phishing">Phishing/Fake Accounts</option>
              <option value="impersonation">Impersonation</option>
              <option value="ponzi">Ponzi Scheme</option>
              <option value="fake_investment">Fake Investment</option>
              <option value="romance">Romance Scam</option>
              <option value="money_laundering">Money Laundering</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what happened and how you identified this as a scam..."
              required
              rows={5}
              className="input-field"
            />
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount Lost (Optional)
              </label>
              <input
                type="number"
                name="amountLost"
                value={formData.amountLost}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="input-field"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Scam (Optional)
            </label>
            <input
              type="date"
              name="scamDate"
              value={formData.scamDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-2">📋 What we need to verify reports:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Clear identification of scam identifier</li>
            <li>✓ Detailed description of the scam</li>
            <li>✓ Evidence or proof of the scam (if possible)</li>
            <li>✓ Your contact information (kept confidential)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
