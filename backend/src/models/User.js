import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'worker', 'society_admin', 'federation_admin', 'platform_admin'],
    required: true
  },
  customerType: { type: String, enum: ['Household', 'Institution'], default: 'Household' },
  institutionName: { type: String },
  institutionType: { type: String },
  contactPerson: { type: String },
  password: { type: String, required: true },
  address: { type: String },
  location: {
    lat: Number,
    lng: Number,
    area: String,
    city: String
  },
  societyId: { type: String },
  federationId: { type: String },
  workerId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
