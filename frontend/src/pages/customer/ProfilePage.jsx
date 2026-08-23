import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Package,
  CreditCard
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [workerLocations, setWorkerLocations] = useState({});

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (bookings.length === 0) return;
    const interval = setInterval(() => {
      bookings.forEach(async (booking) => {
        if (['ON_THE_WAY', 'ACCEPTED'].includes(booking.status) && booking.workerId) {
          try {
            const res = await api.getJobWorkerLocation(booking.id);
            if (res.success && res.location) {
              setWorkerLocations(prev => ({ ...prev, [booking.id]: res.location }));
            }
          } catch (err) {}
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [bookings]);

  const fetchBookings = async () => {
    try {
      const res = await api.getJobs();
      if (res.success) {
        setBookings(res.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'REQUESTED': 'bg-yellow-100 text-yellow-800',
      'MATCHING': 'bg-blue-100 text-blue-800',
      'OFFERED': 'bg-purple-100 text-purple-800',
      'ACCEPTED': 'bg-green-100 text-green-800',
      'ON_THE_WAY': 'bg-indigo-100 text-indigo-800',
      'ARRIVED': 'bg-cyan-100 text-cyan-800',
      'IN_PROGRESS': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'PAID': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED' || status === 'PAID') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'CANCELLED') return <AlertCircle className="w-4 h-4" />;
    if (['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(status)) return <Loader2 className="w-4 h-4 animate-spin" />;
    return <Clock className="w-4 h-4" />;
  };

  const activeBookings = bookings.filter(b => !['COMPLETED', 'PAID', 'CANCELLED'].includes(b.status));
  const pastBookings = bookings.filter(b => ['COMPLETED', 'PAID'].includes(b.status));

  const filteredBookings = activeTab === 'active' ? activeBookings : pastBookings;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user?.name || 'User'}</h1>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                {user?.role === 'customer' ? 'Customer' : user?.role || 'User'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
              <p className="text-xs text-gray-600">Total Bookings</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{activeBookings.length}</p>
              <p className="text-xs text-gray-600">Active</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{pastBookings.length}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">
                ₹{bookings.reduce((sum, b) => sum + (b.pricing?.grossAmount || 0), 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-600">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 text-sm font-semibold transition ${
                activeTab === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active Bookings ({activeBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-3 text-sm font-semibold transition ${
                activeTab === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Past Bookings ({pastBookings.length})
            </button>
          </div>

          <div className="p-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No {activeTab} bookings</p>
                <Link to="/customer" className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Book a Service
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-xl p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{booking.serviceCategory || 'Service'}</h3>
                        <p className="text-sm text-gray-500">{booking.problemDescription?.substring(0, 50)}...</p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Live Worker Location */}
                    {['ON_THE_WAY', 'ACCEPTED'].includes(booking.status) && workerLocations[booking.id] && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-indigo-800 font-semibold text-sm mb-1">
                          <Navigation className="w-4 h-4 animate-pulse" />
                          Worker is on the way!
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <p>Lat: {workerLocations[booking.id].lat?.toFixed(4)}</p>
                          <p>Lng: {workerLocations[booking.id].lng?.toFixed(4)}</p>
                        </div>
                        <div className="mt-2 bg-white rounded-lg p-2 h-32 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100"></div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 bg-blue-600 rounded-full animate-ping"></div>
                            <div className="w-3 h-3 bg-blue-600 rounded-full absolute top-0.5 left-0.5"></div>
                          </div>
                          <p className="absolute bottom-1 left-2 text-[10px] text-gray-500">Live tracking active</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {booking.scheduledDate || 'Today'}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-3 h-3" />
                        {booking.scheduledTime || 'ASAP'}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="w-3 h-3" />
                        {booking.customerAddress?.substring(0, 20)}...
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-gray-800">
                        <CreditCard className="w-3 h-3" />
                        ₹{booking.pricing?.grossAmount || 0}
                      </div>
                    </div>

                    {booking.workerName && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                            {booking.workerName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{booking.workerName}</p>
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Star className="w-3 h-3 fill-current" />
                              {booking.workerRating || '4.8'}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {booking.pricing?.netWorkerEarnings ? `Worker earns ₹${booking.pricing.netWorkerEarnings}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/customer" className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">New Booking</p>
          </Link>
          <Link to="/customer/househelp" className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition">
            <span className="text-3xl">🏠</span>
            <p className="text-sm font-medium text-gray-800 mt-2">Househelp</p>
          </Link>
          <Link to="/customer/beauty-spa" className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition">
            <span className="text-3xl">💆</span>
            <p className="text-sm font-medium text-gray-800 mt-2">Beauty & Spa</p>
          </Link>
          <Link to="/customer/bookings" className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-lg transition">
            <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-800">Invoices</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
