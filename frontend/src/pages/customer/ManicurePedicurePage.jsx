import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function ManicurePedicurePage() {
  const [services, setServices] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const servicesData = await api.getServices();
      setServices(servicesData.services?.find(s => s.category === 'Manicure & Pedicure'));
    } catch (err) {
      console.error('Failed to load nail services:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading nail services...</p>
        </div>
      </div>
    );
  }

  const subServices = services?.subServices || [
    { id: 'SUB-BASIC-MANICURE', name: 'Basic Manicure', price: 350, duration: 30 },
    { id: 'SUB-BASIC-PEDICURE', name: 'Basic Pedicure', price: 400, duration: 35 },
    { id: 'SUB-GEL-MANICURE', name: 'Gel Manicure', price: 600, duration: 45 },
    { id: 'SUB-GEL-PEDICURE', name: 'Gel Pedicure', price: 700, duration: 50 },
    { id: 'SUB-NAIL-ART', name: 'Nail Art Design', price: 300, duration: 30 },
    { id: 'SUB-FULL-SET', name: 'Full Manicure + Pedicure', price: 800, duration: 75 },
    { id: 'SUB-PARAFFIN', name: 'Paraffin Wax Treatment', price: 500, duration: 30 },
    { id: 'SUB-FOOT-SPA', name: 'Foot Spa & Massage', price: 450, duration: 40 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Professional Manicure & Pedicure</h1>
          <p className="text-gray-600">Nail care, cuticle treatment, nail art, and foot spa at home. Certified cooperative workers.</p>
        </div>

        {/* Service Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {subServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl shadow-md p-4 cursor-pointer transition hover:shadow-lg ${
                selectedService?.id === service.id ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedService(service)}
            >
              <div className="text-3xl mb-2">
                {service.name.includes('Manicure') && '💅'}
                {service.name.includes('Pedicure') && '🦶'}
                {service.name.includes('Gel') && '✨'}
                {service.name.includes('Art') && '🎨'}
                {service.name.includes('Full') && '👑'}
                {service.name.includes('Paraffin') && '🕯️'}
                {service.name.includes('Spa') && '💆'}
              </div>
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
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option>Morning (9 AM - 12 PM)</option>
                  <option>Afternoon (12 PM - 3 PM)</option>
                  <option>Evening (3 PM - 6 PM)</option>
                  <option>Late Evening (6 PM - 9 PM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nail Color Preference</label>
                <input
                  type="text"
                  placeholder="e.g., Red, Pink, French, Nude"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nail Art Style</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option>No Art</option>
                  <option>Simple Design</option>
                  <option>Floral Pattern</option>
                  <option>Geometric Design</option>
                  <option>Custom Design</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  placeholder="Any allergies, nail conditions, or special requests..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
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
            <button
              className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              onClick={() => alert('Booking confirmed! Nail expert will arrive at your location.')}
            >
              Confirm Booking - ₹{selectedService.price}
            </button>
          </div>
        )}

        {/* Subscription Packs */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📦 Nail Care Subscription Packs - Save up to 30%</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: '4 Sessions', price: 1800, perSession: 450, savings: 10 },
              { name: '8 Sessions', price: 3200, perSession: 400, savings: 20 },
              { name: '12 Sessions', price: 4200, perSession: 350, savings: 30 }
            ].map((pack, idx) => (
              <div key={idx} className="border-2 border-purple-200 rounded-lg p-4 hover:border-purple-500 transition">
                <h3 className="font-semibold text-gray-800 mb-2">{pack.name}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-purple-600">₹{pack.price}</span>
                  <span className="text-sm text-gray-500">₹{pack.perSession}/session</span>
                </div>
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Save {pack.savings}%
                </span>
                <button className="w-full mt-3 bg-purple-100 text-purple-800 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition">
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
            {[
              { name: 'Kavita Joshi', skill: 'Gel Nails, Nail Art, Paraffin', rating: 4.85, experience: '4 years', available: true },
              { name: 'Anita Kumari', skill: 'Manicure, Pedicure, Nail Art', rating: 4.88, experience: '6 years', available: true }
            ].map((worker, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{worker.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    ✓ Available
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{worker.skill}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-600">⭐ {worker.rating}</span>
                  <span className="text-gray-500">{worker.experience}</span>
                </div>
                <button className="w-full mt-3 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                  Book Session
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Nail Art Gallery */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎨 Popular Nail Art Designs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'French Tips', price: '₹300+', difficulty: 'Easy' },
              { name: 'Floral Pattern', price: '₹400+', difficulty: 'Medium' },
              { name: 'Geometric Design', price: '₹350+', difficulty: 'Medium' },
              { name: 'Custom Art', price: '₹500+', difficulty: 'Advanced' }
            ].map((design, idx) => (
              <div key={idx} className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">💅</div>
                <h4 className="font-medium text-gray-800">{design.name}</h4>
                <p className="text-sm text-purple-600">{design.price}</p>
                <span className="text-xs text-gray-500">{design.difficulty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cooperative Benefits */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Why Choose Cooperative Nail Services?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">💅 Certified Artists</h3>
              <p className="text-sm text-purple-700">All nail technicians are certified and trained.</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-4">
              <h3 className="font-semibold text-pink-800 mb-2">🏠 Home Service</h3>
              <p className="text-sm text-pink-700">Professional nail care in the comfort of your home.</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">💰 Fair Pricing</h3>
              <p className="text-sm text-green-700">Transparent pricing, no hidden charges, 95% to worker.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
