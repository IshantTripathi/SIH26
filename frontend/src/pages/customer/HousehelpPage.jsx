import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function HousehelpPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState(null);
  const [subscriptionPacks, setSubscriptionPacks] = useState([]);
  const [instantBooking, setInstantBooking] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingMode, setBookingMode] = useState('instant');
  const [problemDescription, setProblemDescription] = useState('');
  const [recurringOption, setRecurringOption] = useState('Daily');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [servicesData, packsData] = await Promise.all([
        api.getServices(),
        api.getSubscriptionPacks('Househelp')
      ]);
      setServices(servicesData.services?.find(s => s.category === 'Househelp'));
      setSubscriptionPacks(packsData.packs || []);
    } catch (err) {
      console.error('Failed to load househelp data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBooking = async () => {
    try {
      const result = await api.createInstantBooking({
        customerId: localStorage.getItem('coop_demo_user_id'),
        serviceCategory: 'Househelp',
        customerLocation: { lat: 28.6139, lng: 77.2090 },
        problemDescription: problemDescription || 'Househelp required'
      });
      setInstantBooking(result.instantBooking);
    } catch (err) {
      alert('Instant booking failed: ' + err.message);
    }
  };

  const handlePurchasePack = async (pack) => {
    try {
      const result = await api.purchaseSubscriptionPack({
        customerId: localStorage.getItem('coop_demo_user_id'),
        serviceCategory: 'Househelp',
        packId: pack.id
      });
      alert(`Successfully purchased ${pack.name}! You have ${pack.totalSessions || pack.hoursPerWeek || pack.hoursPerMonth} sessions.`);
      setSelectedPack(null);
    } catch (err) {
      alert('Purchase failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading househelp services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Instant Househelp Services</h1>
          <p className="text-gray-600">Get a verified househelp within 30 minutes. Cooperative workers, fair wages, 95% to worker.</p>
        </div>

        {/* Booking Mode Toggle */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setBookingMode('instant')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                bookingMode === 'instant'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚡ Instant Booking (30 min)
            </button>
            <button
              onClick={() => setBookingMode('subscription')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                bookingMode === 'subscription'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Subscription Packs
            </button>
            <button
              onClick={() => setBookingMode('recurring')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                bookingMode === 'recurring'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔄 Recurring Booking
            </button>
          </div>

          {/* Instant Booking */}
          {bookingMode === 'instant' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">⚡ Instant Booking Available</h3>
                <p className="text-sm text-green-700">
                  Get a househelp within 30 minutes. Workers are pre-verified and ready to serve.
                  Additional ₹50 instant booking fee applies.
                </p>
              </div>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe what you need help with (e.g., Cooking, Cleaning, Dishwashing)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
              />
              <button
                onClick={handleInstantBooking}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Find Instant Househelp
              </button>
              {instantBooking && (
                <div className="bg-white border-2 border-green-500 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Searching for workers...</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {instantBooking.workersNotified} workers notified in your area
                  </p>
                  {instantBooking.nearestWorker && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium">{instantBooking.nearestWorker.name}</p>
                      <p className="text-sm text-gray-600">
                        {instantBooking.nearestWorker.distance} km away • ~{instantBooking.nearestWorker.estimatedArrivalMin} min arrival
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Subscription Packs */}
          {bookingMode === 'subscription' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📦 Save up to 25% with Subscription Packs</h3>
                <p className="text-sm text-blue-700">
                  Book regular househelp services and save. Packs are valid for 3 months.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptionPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      selectedPack?.id === pack.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setSelectedPack(pack)}
                  >
                    <h4 className="font-semibold text-gray-800">{pack.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{pack.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">₹{pack.price}</span>
                      <span className="text-sm text-gray-500">₹{pack.pricePerHour}/hr</span>
                    </div>
                    {pack.savings > 0 && (
                      <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Save {pack.savings}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {selectedPack && (
                <button
                  onClick={() => handlePurchasePack(selectedPack)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  Purchase {selectedPack.name} - ₹{selectedPack.price}
                </button>
              )}
            </div>
          )}

          {/* Recurring Booking */}
          {bookingMode === 'recurring' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">🔄 Schedule Recurring Househelp</h3>
                <p className="text-sm text-purple-700">
                  Set up a regular schedule and get the same trusted househelp every time.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Daily', 'Alternate Days', 'Weekly', 'Monthly'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setRecurringOption(option)}
                    className={`py-3 px-4 rounded-lg font-medium transition ${
                      recurringOption === option
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Schedule Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg">
                      <option>Morning (8 AM - 12 PM)</option>
                      <option>Afternoon (12 PM - 4 PM)</option>
                      <option>Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg">
                      <option>2 hours</option>
                      <option>4 hours</option>
                      <option>6 hours</option>
                      <option>8 hours</option>
                    </select>
                  </div>
                </div>
                <button
                  className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                  onClick={() => alert('Recurring booking scheduled! Same househelp will be assigned.')}
                >
                  Schedule {recurringOption} Househelp
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Worker Listings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Available Househelp Workers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Ritu Sharma', skill: 'Cooking & Cleaning', rating: 4.92, experience: '5 years', instant: true },
              { name: 'Priya Verma', skill: 'North Indian Cooking', rating: 4.95, experience: '7 years', instant: true },
              { name: 'Deepa Nair', skill: 'Deep Cleaning', rating: 4.80, experience: '3 years', instant: true }
            ].map((worker, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    ⚡ Instant
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{worker.skill}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-600">⭐ {worker.rating}</span>
                  <span className="text-gray-500">{worker.experience}</span>
                </div>
                <button
                  className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  onClick={() => navigate('/customer/dashboard')}
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cooperative Benefits */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Why Choose Cooperative Househelp?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">💰 Fair Wages</h3>
              <p className="text-sm text-green-700">Workers get 95% of your payment. No exploitation.</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🛡️ Welfare Fund</h3>
              <p className="text-sm text-blue-700">1% goes to worker welfare and insurance.</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">🤝 Democratic</h3>
              <p className="text-sm text-purple-700">Workers are cooperative members, not contractors.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
