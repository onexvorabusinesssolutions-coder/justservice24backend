const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: String,
  occupation: String,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dob: String,
  maritalStatus: String,
  avatar: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  password: String,

  // OTP Auth
  otp: String,
  otpExpiry: Date,

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpiry: Date,

  // Push notifications
  fcmToken: String,

  // Referral
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCode: { type: String, unique: true, sparse: true },

  // Favourites
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }],

  // Email Verification
  emailVerifyToken: String,
  emailVerifyExpiry: Date,

  // Change Password OTP
  changePasswordOtp: String,
  changePasswordOtpExpiry: Date,

  // Token blacklist (logout)
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
