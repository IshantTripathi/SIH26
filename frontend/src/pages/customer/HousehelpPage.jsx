import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function HousehelpPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState(null);
  const [subscriptionPacks, setSubscriptionPacks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingMode, setBookingMode] = useState('instant');
  const [problemDescription, setProblemDescription] = useState('');
  const [recurringOption, setRecurringOption] = useState('Daily');
  const [recurringTime, setRecurringTime] = useState('Morning (8 AM - 12 PM)');
  const [recurringDuration, setRecurringDuration] = useState('4 hours');
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [servicesData, packsData, workersData] = await Promise.all([
        api.getServices(),
        api.getSubscriptionPacks('Househelp').catch(() => ({ packs: [] })),
        api.getWorkers ? api.getWorkers('Househelp') : Promise.resolve({ workers: [] })
      ]);
      setServices(servicesData.services?.find(s => s.category === 'Househelp'));
      setSubscriptionPacks(packsData.packs || []);
      setWorkers(workersData.workers || []);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantBooking = async () => {
    if (!user) return alert('Please login first');
    setBooking(true);
    try {
      const res = await api.createJob({
        serviceCategory: 'Househelp',
        problemDescription: problemDescription || 'Househelp required - Cooking, Cleaning, Dishwashing',
        urgency: 'Urgent',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: 'Immediately',
        customerAddress: user.address || 'Delhi NCR',
        customerLocation: { lat: 28.6140, lng: 77.2095 },
        customAmount: 450,
        durationHours: 4
      });
      if (res.success) setBooked(res.job);
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleRecurringBooking = async () => {
    if (!user) return alert('Please login first');
    setBooking(true);
    try {
      const dur = parseInt(recurringDuration) || 4;
      const res = await api.createJob({
        serviceCategory: 'Househelp',
        problemDescription: `Recurring ${recurringOption} househelp - ${problemDescription || 'Regular cleaning and cooking'}`,
        urgency: 'Normal',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: recurringTime,
        customerAddress: user.address || 'Delhi NCR',
        customerLocation: { lat: 28.6140, lng: 77.2095 },
        customAmount: dur * 120,
        durationHours: dur
      });
      if (res.success) setBooked(res.job);
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setBooking(false);
    }
  };

  const handlePurchasePack = async (pack) => {
    if (!user) return alert('Please login first');
    try {
      await api.createJob({
        serviceCategory: 'Househelp',
        problemDescription: `Subscription: ${pack.name} - ${pack.description || 'Regular househelp service'}`,
        urgency: 'Normal',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: 'Morning (8 AM - 12 PM)',
        customerAddress: user.address || 'Delhi NCR',
        customerLocation: { lat: 28.6140, lng: 77.2095 },
        customAmount: pack.price,
        durationHours: 4
      });
      alert(`${pack.name} purchased! You can now book sessions from your profile.`);
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

  if (booked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">Your househelp service has been booked.</p>
          <div className="bg-green-50 rounded-lg p-4 text-sm text-left space-y-2 mb-6">
            <p><strong>Job Code:</strong> {booked.code}</p>
            <p><strong>Service:</strong> Househelp</p>
            <p><strong>Status:</strong> {booked.status}</p>
            <p><strong>Amount:</strong> ₹{booked.pricing?.grossAmount || 450}</p>
            <p><strong>Worker:</strong> {booked.workerName || 'Assigning nearest househelp...'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/customer/profile')} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
              View in Profile
            </button>
            <button onClick={() => { setBooked(null); setProblemDescription(''); }} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300">
              Book Another
            </button>
          </div>
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
            <button onClick={() => setBookingMode('instant')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${bookingMode === 'instant' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Instant Booking (30 min)
            </button>
            <button onClick={() => setBookingMode('subscription')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${bookingMode === 'subscription' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Subscription Packs
            </button>
            <button onClick={() => setBookingMode('recurring')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${bookingMode === 'recurring' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Recurring Booking
            </button>
          </div>

          {/* Instant Booking */}
          {bookingMode === 'instant' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Instant Booking Available</h3>
                <p className="text-sm text-green-700">Get a househelp within 30 minutes. Workers are pre-verified and ready to serve. Additional Rs 50 instant booking fee applies.</p>
              </div>
              <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe what you need help with (e.g., Cooking, Cleaning, Dishwashing)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" rows={3} />
              <div className="grid grid-cols-3 gap-3 text-sm">
                <button onClick={() => setProblemDescription('Full kitchen cooking - lunch and dinner for 4 people')}
                  className="bg-green-50 border border-green-200 rounded-lg p-3 text-left hover:bg-green-100 transition">
                  <span className="font-medium text-green-800">Cooking</span>
                  <p className="text-xs text-gray-500">Lunch + Dinner</p>
                </button>
                <button onClick={() => setProblemDescription('Complete home cleaning - all rooms, bathroom, kitchen')}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left hover:bg-blue-100 transition">
                  <span className="font-medium text-blue-800">Cleaning</span>
                  <p className="text-xs text-gray-500">Full home</p>
                </button>
                <button onClick={() => setProblemDescription('Cooking and cleaning together for the day')}
                  className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-left hover:bg-purple-100 transition">
                  <span className="font-medium text-purple-800">Cook + Clean</span>
                  <p className="text-xs text-gray-500">Complete help</p>
                </button>
              </div>
              <button onClick={handleInstantBooking} disabled={booking}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {booking ? 'Finding Househelp...' : 'Find Instant Househelp'}
              </button>
            </div>
          )}

          {/* Subscription Packs */}
          {bookingMode === 'subscription' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Save up to 25% with Subscription Packs</h3>
                <p className="text-sm text-blue-700">Book regular househelp services and save. Packs are valid for 3 months.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(subscriptionPacks.length > 0 ? subscriptionPacks : [
                  { id: 'PACK-4WK', name: '4 Weeks Pack', description: '4 weeks of daily househelp (2 hrs/day)', price: 4800, pricePerHour: 150, savings: 15, totalSessions: 20 },
                  { id: 'PACK-8WK', name: '8 Weeks Pack', description: '8 weeks of daily househelp (2 hrs/day)', price: 8640, pricePerHour: 135, savings: 22, totalSessions: 40 },
                  { id: 'PACK-12WK', name: '12 Weeks Pack', description: '12 weeks of daily househelp (2 hrs/day)', price: 11520, pricePerHour: 120, savings: 28, totalSessions: 60 }
                ]).map((pack) => (
                  <div key={pack.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${selectedPack?.id === pack.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                    onClick={() => setSelectedPack(pack)}>
                    <h4 className="font-semibold text-gray-800">{pack.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{pack.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">₹{pack.price}</span>
                      <span className="text-sm text-gray-500">₹{pack.pricePerHour}/hr</span>
                    </div>
                    {pack.savings > 0 && (
                      <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Save {pack.savings}%</span>
                    )}
                  </div>
                ))}
              </div>
              {selectedPack && (
                <button onClick={() => handlePurchasePack(selectedPack)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
                  Purchase {selectedPack.name} - ₹{selectedPack.price}
                </button>
              )}
            </div>
          )}

          {/* Recurring Booking */}
          {bookingMode === 'recurring' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">Schedule Recurring Househelp</h3>
                <p className="text-sm text-purple-700">Set up a regular schedule and get the same trusted househelp every time.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Daily', 'Alternate Days', 'Weekly', 'Monthly'].map((option) => (
                  <button key={option} onClick={() => setRecurringOption(option)}
                    className={`py-3 px-4 rounded-lg font-medium transition ${recurringOption === option ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {option}
                  </button>
                ))}
              </div>
              <textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="What kind of help do you need regularly?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" rows={2} />
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Schedule Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                    <select value={recurringTime} onChange={(e) => setRecurringTime(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg">
                      <option>Morning (8 AM - 12 PM)</option>
                      <option>Afternoon (12 PM - 4 PM)</option>
                      <option>Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <select value={recurringDuration} onChange={(e) => setRecurringDuration(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg">
                      <option>2 hours</option>
                      <option>4 hours</option>
                      <option>6 hours</option>
                      <option>8 hours</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 bg-purple-50 rounded-lg p-3 text-sm">
                  <p><strong>Estimated cost:</strong> ₹{parseInt(recurringDuration || 4) * 120}/day ({recurringOption})</p>
                  <p className="text-gray-500">Same househelp assigned for consistency</p>
                </div>
                <button onClick={handleRecurringBooking} disabled={booking}
                  className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50">
                  {booking ? 'Scheduling...' : `Schedule ${recurringOption} Househelp`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Worker Listings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Available Househelp Workers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.length > 0 ? workers.map((worker) => (
              <div key={worker.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Instant</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{worker.trade} | {(worker.skills || []).join(', ')}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-600">⭐ {worker.rating}</span>
                  <span className="text-gray-500">{worker.experience || '3+ years'}</span>
                </div>
                <button onClick={() => { setProblemDescription(`Need househelp - ${worker.trade}`); setBookingMode('instant'); }}
                  className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  Book Now
                </button>
              </div>
            )) : (
              [
                { id: 'W1', name: 'Ritu Sharma', trade: 'Cooking & Cleaning', rating: 4.92, experience: '5 years' },
                { id: 'W2', name: 'Priya Verma', trade: 'North Indian Cooking', rating: 4.95, experience: '7 years' },
                { id: 'W3', name: 'Deepa Nair', trade: 'Deep Cleaning', rating: 4.80, experience: '3 years' }
              ].map((worker) => (
                <div key={worker.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Instant</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{worker.trade}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-yellow-600">⭐ {worker.rating}</span>
                    <span className="text-gray-500">{worker.experience}</span>
                  </div>
                  <button onClick={() => { setProblemDescription(`Need househelp - ${worker.trade}`); setBookingMode('instant'); }}
                    className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                    Book Now
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cooperative Benefits */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Why Choose Cooperative Househelp?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Fair Wages</h3>
              <p className="text-sm text-green-700">Workers get 95% of your payment. No exploitation.</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Welfare Fund</h3>
              <p className="text-sm text-blue-700">1% goes to worker welfare and insurance.</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Democratic</h3>
              <p className="text-sm text-purple-700">Workers are cooperative members, not contractors.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
