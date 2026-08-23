import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function BeautySpaPage() {
  const [services, setServices] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(null);
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('Morning (9 AM - 12 PM)');
  const [bookInstructions, setBookInstructions] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [servicesData, workersData] = await Promise.all([
        api.getServices(),
        api.getWorkers ? api.getWorkers('Beauty') : Promise.resolve({ workers: [] })
      ]);
      setServices(servicesData.services?.find(s => s.category === 'Beauty & Spa'));
      setWorkers(workersData.workers || []);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedService || !user) return;
    setBooking(true);
    try {
      const res = await api.createJob({
        serviceCategory: 'Beauty & Spa',
        problemDescription: `${selectedService.name} - ${bookInstructions || 'No special instructions'}`,
        urgency: 'Normal',
        scheduledDate: bookDate,
        scheduledTime: bookTime,
        customerAddress: user.address || 'Delhi NCR',
        customerLocation: { lat: 28.6140, lng: 77.2095 },
        customAmount: selectedService.price,
        durationHours: Math.ceil((selectedService.duration || 60) / 60)
      });
      if (res.success) {
        setBooked(res.job);
      }
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading beauty services...</p>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">Your {selectedService?.name} has been booked.</p>
          <div className="bg-pink-50 rounded-lg p-4 text-sm text-left space-y-2 mb-6">
            <p><strong>Job Code:</strong> {booked.code}</p>
            <p><strong>Service:</strong> {selectedService?.name}</p>
            <p><strong>Date:</strong> {bookDate}</p>
            <p><strong>Time:</strong> {bookTime}</p>
            <p><strong>Amount:</strong> ₹{selectedService?.price}</p>
            <p><strong>Worker:</strong> {booked.workerName || 'Assigning...'}</p>
            <p><strong>Status:</strong> {booked.status}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/customer/profile')} className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700">
              View in Profile
            </button>
            <button onClick={() => { setBooked(null); setSelectedService(null); }} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300">
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subServices = services?.subServices || [
    { id: 'SUB-FACIAL', name: 'Facial Treatment', price: 800, duration: 60 },
    { id: 'SUB-BODY-MASSAGE', name: 'Body Massage', price: 1200, duration: 90 },
    { id: 'SUB-HAIR-SPA', name: 'Hair Spa Treatment', price: 600, duration: 45 },
    { id: 'SUB-AROMA', name: 'Aromatherapy Session', price: 1500, duration: 90 },
    { id: 'SUB-HOT-STONE', name: 'Hot Stone Massage', price: 1800, duration: 90 },
    { id: 'SUB-HEAD-MASSAGE', name: 'Head Massage', price: 400, duration: 30 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Beauty & Spa Services</h1>
          <p className="text-gray-600">Professional beauty treatments at home. Certified cooperative workers, transparent pricing.</p>
        </div>

        {/* Service Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {subServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition hover:shadow-lg ${
                selectedService?.id === service.id ? 'ring-2 ring-pink-500' : ''
              }`}
              onClick={() => setSelectedService(service)}
            >
              <div className="text-4xl mb-3">
                {service.name.includes('Facial') && '✨'}
                {service.name.includes('Massage') && '💆'}
                {service.name.includes('Hair') && '💇'}
                {service.name.includes('Aroma') && '🌸'}
                {service.name.includes('Stone') && '🪨'}
                {service.name.includes('Head') && '🧠'}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{service.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-pink-600">₹{service.price}</span>
                <span className="text-sm text-gray-500">{service.duration} min</span>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Form */}
        {selectedService && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Book {selectedService.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  <option>Morning (9 AM - 12 PM)</option>
                  <option>Afternoon (12 PM - 3 PM)</option>
                  <option>Evening (3 PM - 6 PM)</option>
                  <option>Late Evening (6 PM - 9 PM)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={bookInstructions}
                  onChange={(e) => setBookInstructions(e.target.value)}
                  placeholder="Any allergies, preferences, or special requests..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 bg-pink-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{selectedService.name}</span>
                <span className="font-bold">₹{selectedService.price}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Duration: {selectedService.duration} minutes</span>
                <span>Worker gets 95% (₹{Math.round(selectedService.price * 0.95)})</span>
              </div>
            </div>
            <button
              onClick={handleBook}
              disabled={booking}
              className="w-full mt-4 bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition disabled:opacity-50"
            >
              {booking ? 'Booking...' : `Confirm Booking - ₹${selectedService.price}`}
            </button>
          </div>
        )}

        {/* Subscription Packs */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Beauty Subscription Packs - Save up to 25%</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: '4 Sessions', price: 2800, perSession: 700, savings: 12 },
              { name: '8 Sessions', price: 5000, perSession: 625, savings: 22 },
              { name: '12 Sessions', price: 7200, perSession: 600, savings: 25 }
            ].map((pack, idx) => (
              <div key={idx} className="border-2 border-pink-200 rounded-lg p-4 hover:border-pink-500 transition">
                <h3 className="font-semibold text-gray-800 mb-2">{pack.name}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-pink-600">₹{pack.price}</span>
                  <span className="text-sm text-gray-500">₹{pack.perSession}/session</span>
                </div>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Save {pack.savings}%</span>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.purchasePack ? await api.purchasePack('Beauty & Spa', pack.name, pack.price) : null;
                      alert(res?.success ? `${pack.name} purchased! Credits added.` : 'Pack purchase coming soon!');
                    } catch { alert('Pack purchase coming soon!'); }
                  }}
                  className="w-full mt-3 bg-pink-100 text-pink-800 py-2 rounded-lg text-sm font-medium hover:bg-pink-200 transition"
                >
                  Purchase Pack
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Available Workers */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Available Beauty Experts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.length > 0 ? workers.map((worker) => (
              <div
                key={worker.id}
                className={`border rounded-lg p-4 hover:shadow-md transition cursor-pointer ${selectedWorker?.id === worker.id ? 'ring-2 ring-pink-500' : ''}`}
                onClick={() => setSelectedWorker(worker)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Available</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{worker.trade} | {(worker.skills || []).join(', ')}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-600">⭐ {worker.rating}</span>
                  <span className="text-gray-500">{worker.experience || '3+ years'}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(subServices[0]);
                    setSelectedWorker(worker);
                  }}
                  className="w-full mt-3 bg-pink-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
                >
                  Book Session
                </button>
              </div>
            )) : (
              [
                { id: 'W1', name: 'Anita Kumari', trade: 'Facial, Massage', rating: 4.88, experience: '6 years' },
                { id: 'W2', name: 'Sunita Devi', trade: 'Aromatherapy, Hot Stone', rating: 4.93, experience: '8 years' }
              ].map((worker) => (
                <div key={worker.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Available</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{worker.trade}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-yellow-600">⭐ {worker.rating}</span>
                    <span className="text-gray-500">{worker.experience}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedService(subServices[0]); }}
                    className="w-full mt-3 bg-pink-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
                  >
                    Book Session
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cooperative Benefits */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Why Choose Cooperative Beauty Services?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-pink-50 rounded-lg p-4">
              <h3 className="font-semibold text-pink-800 mb-2">Certified Experts</h3>
              <p className="text-sm text-pink-700">All beauty professionals are certified and verified.</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">Home Service</h3>
              <p className="text-sm text-purple-700">Professional treatments in the comfort of your home.</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Fair Pricing</h3>
              <p className="text-sm text-green-700">Transparent pricing, no hidden charges, 95% to worker.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
