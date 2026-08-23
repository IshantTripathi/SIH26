import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ManicurePedicurePage() {
  const [services, setServices] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(null);
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTime, setBookTime] = useState('Morning (9 AM - 12 PM)');
  const [bookInstructions, setBookInstructions] = useState('');
  const [nailColor, setNailColor] = useState('');
  const [nailArt, setNailArt] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [servicesData, workersData] = await Promise.all([
        api.getServices(),
        api.getWorkers ? api.getWorkers('Nail') : Promise.resolve({ workers: [] })
      ]);
      setServices(servicesData.services?.find(s => s.category === 'Manicure & Pedicure'));
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
      const desc = `${selectedService.name}${nailColor ? ' - Color: ' + nailColor : ''}${nailArt ? ' - Art: ' + nailArt : ''} - ${bookInstructions || 'No special instructions'}`;
      const res = await api.createJob({
        serviceCategory: 'Manicure & Pedicure',
        problemDescription: desc,
        urgency: 'Normal',
        scheduledDate: bookDate,
        scheduledTime: bookTime,
        customerAddress: user.address || 'Delhi NCR',
        customerLocation: { lat: 28.6140, lng: 77.2095 },
        customAmount: selectedService.price,
        durationHours: Math.ceil((selectedService.duration || 60) / 60)
      });
      if (res.success) setBooked(res.job);
    } catch (err) {
      alert('Booking failed: ' + err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nail services...</p>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">Your {selectedService?.name} has been booked.</p>
          <div className="bg-purple-50 rounded-lg p-4 text-sm text-left space-y-2 mb-6">
            <p><strong>Job Code:</strong> {booked.code}</p>
            <p><strong>Service:</strong> {selectedService?.name}</p>
            <p><strong>Date:</strong> {bookDate}</p>
            <p><strong>Time:</strong> {bookTime}</p>
            <p><strong>Amount:</strong> ₹{selectedService?.price}</p>
            <p><strong>Worker:</strong> {booked.workerName || 'Assigning...'}</p>
            <p><strong>Status:</strong> {booked.status}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/customer/profile')} className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
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
    { id: 'SUB-CLASSIC-MANICURE', name: 'Classic Manicure', price: 350, duration: 30 },
    { id: 'SUB-GEL-MANICURE', name: 'Gel Manicure', price: 600, duration: 45 },
    { id: 'SUB-CLASSIC-PEDICURE', name: 'Classic Pedicure', price: 450, duration: 40 },
    { id: 'SUB-SPA-PEDICURE', name: 'Spa Pedicure', price: 800, duration: 60 },
    { id: 'SUB-NAIL-ART', name: 'Nail Art Design', price: 250, duration: 30 },
    { id: 'SUB-NAIL-EXTENSION', name: 'Nail Extensions', price: 1200, duration: 60 },
    { id: 'SUB-PARAFFIN', name: 'Paraffin Treatment', price: 500, duration: 30 },
    { id: 'SUB-COMBINED', name: 'Manicure + Pedicure Combo', price: 700, duration: 60 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manicure & Pedicure Services</h1>
          <p className="text-gray-600">Professional nail care at home. Expert technicians, transparent pricing.</p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {subServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition hover:shadow-lg ${
                selectedService?.id === service.id ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedService(service)}
            >
              <div className="text-3xl mb-2">💅</div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{service.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-purple-600">₹{service.price}</span>
                <span className="text-xs text-gray-500">{service.duration} min</span>
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
                <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select value={bookTime} onChange={(e) => setBookTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>Morning (9 AM - 12 PM)</option>
                  <option>Afternoon (12 PM - 3 PM)</option>
                  <option>Evening (3 PM - 6 PM)</option>
                  <option>Late Evening (6 PM - 9 PM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nail Color Preference</label>
                <input type="text" value={nailColor} onChange={(e) => setNailColor(e.target.value)}
                  placeholder="e.g., Red, Pink, French, Nude"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nail Art Style</label>
                <select value={nailArt} onChange={(e) => setNailArt(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">None</option>
                  <option>French Tips</option>
                  <option>Ombre</option>
                  <option>Glitter</option>
                  <option>Floral Design</option>
                  <option>Geometric</option>
                  <option>Custom (Discuss with expert)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea value={bookInstructions} onChange={(e) => setBookInstructions(e.target.value)}
                  placeholder="Any preferences, allergies, or special requests..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" rows={3} />
              </div>
            </div>
            <div className="mt-4 bg-purple-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{selectedService.name}</span>
                <span className="font-bold">₹{selectedService.price}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Duration: {selectedService.duration} minutes</span>
                <span>Worker gets 95% (₹{Math.round(selectedService.price * 0.95)})</span>
              </div>
            </div>
            <button onClick={handleBook} disabled={booking}
              className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50">
              {booking ? 'Booking...' : `Confirm Booking - ₹${selectedService.price}`}
            </button>
          </div>
        )}

        {/* Subscription Packs */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Nail Care Subscription Packs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: '4 Sessions', price: 2400, perSession: 600, savings: 14 },
              { name: '8 Sessions', price: 4200, perSession: 525, savings: 25 },
              { name: '12 Sessions', price: 6000, perSession: 500, savings: 29 }
            ].map((pack, idx) => (
              <div key={idx} className="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-500 transition">
                <h3 className="font-semibold text-gray-800 mb-2">{pack.name}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-purple-600">₹{pack.price}</span>
                  <span className="text-sm text-gray-500">₹{pack.perSession}/session</span>
                </div>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Save {pack.savings}%</span>
                <button onClick={() => alert('Pack purchased! Credits added to your account.')}
                  className="w-full mt-3 bg-purple-100 text-purple-800 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition">
                  Purchase Pack
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Available Workers */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Available Nail Experts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.length > 0 ? workers.map((worker) => (
              <div key={worker.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Available</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{worker.trade}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-600">⭐ {worker.rating}</span>
                  <span className="text-gray-500">{worker.experience || '3+ years'}</span>
                </div>
                <button onClick={() => setSelectedService(subServices[0])}
                  className="w-full mt-3 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                  Book Session
                </button>
              </div>
            )) : (
              [
                { id: 'W1', name: 'Kavita Singh', trade: 'Nail Art, Gel, Extensions', rating: 4.91, experience: '5 years' },
                { id: 'W2', name: 'Meena Patel', trade: 'Manicure, Pedicure, Spa', rating: 4.87, experience: '7 years' }
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
                  <button onClick={() => setSelectedService(subServices[0])}
                    className="w-full mt-3 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                    Book Session
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
