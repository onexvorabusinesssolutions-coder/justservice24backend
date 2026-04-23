const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Settings = require('../models/Settings');
const generateReferralCode = require('../utils/generateReferralCode');
const generateOTP = require('../utils/generateOTP');
const notify = require('../utils/notify');
const { sendMail, wrap } = require('../utils/mailer');
const { success, error } = require('../utils/response');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      if (existing.email === email) return error(res, 'Email already registered', 409);
      if (existing.phone === phone) return error(res, 'Phone already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userReferralCode = generateReferralCode(name);

    const user = new User({ name, email, phone, password: hashedPassword, referralCode: userReferralCode });

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        user.referredBy = referrer._id;
        const settings = await Settings.findOne();
        const bonus = settings?.referralBonus || 1;
        await Referral.findOneAndUpdate(
          { userId: referrer._id },
          { $push: { referredUsers: user._id }, $inc: { totalEarned: bonus, balance: bonus } },
          { upsert: true }
        );
        await Referral.findOneAndUpdate(
          { userId: user._id },
          { $inc: { totalEarned: bonus, balance: bonus } },
          { upsert: true }
        );
      }
    }

    await user.save();
    await Referral.create({ userId: user._id, referralCode: userReferralCode });

    await notify({ userId: user._id, type: 'new_user', title: 'Welcome to JustService24! 🎉', message: `Hi ${name}, your account has been created successfully.`, icon: '🎉', isPublic: false });
    await notify({ userId: null, type: 'new_user', title: 'New User Joined! 🚀', message: `${name} just joined JustService24.`, icon: '👤', isPublic: true });

    const token = signToken(user);
    const userData = user.toObject();
    delete userData.password;
    delete userData.otp;
    delete userData.otpExpiry;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpiry;

    success(res, { token, user: userData }, 'Signup successful', 201);
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, 'Invalid email or password', 401);
    if (!user.isActive) return error(res, 'Account is deactivated', 403);
    if (!user.password) return error(res, 'Please use OTP login or reset your password', 400);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 'Invalid email or password', 401);

    const token = signToken(user);
    const userData = user.toObject();
    delete userData.password;
    delete userData.otp;
    delete userData.otpExpiry;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpiry;

    success(res, { token, user: userData }, 'Login successful');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/admin-login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return error(res, 'Invalid credentials', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 'Invalid credentials', 401);

    const token = signToken(user);
    const userData = user.toObject();
    delete userData.password;
    delete userData.otp;
    delete userData.otpExpiry;

    success(res, { token, user: userData }, 'Admin login successful');
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry');
    if (!user) return error(res, 'User not found', 404);
    success(res, user);
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
    success(res, null, 'Logged out successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/send-otp
// Body: { phone }
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[6-9]\d{9}$/.test(phone.trim()))
      return error(res, 'Valid 10-digit phone number is required', 400);

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await User.findOneAndUpdate(
      { phone: phone.trim() },
      { otp, otpExpiry },
      { upsert: true, new: true }
    );

    // In production: send via SMS gateway
    // For now: log it (replace with actual SMS service)
    console.log(`OTP for ${phone}: ${otp}`);

    success(res, process.env.NODE_ENV === 'development' ? { otp } : null, 'OTP sent successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/verify-otp
// Body: { phone, otp }
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return error(res, 'Phone and OTP are required', 400);

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) return error(res, 'User not found', 404);
    if (!user.otp || user.otp !== otp.trim()) return error(res, 'Invalid OTP', 400);
    if (user.otpExpiry < new Date()) return error(res, 'OTP expired. Please request a new one', 400);

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = signToken(user);
    const userData = user.toObject();
    delete userData.password;
    delete userData.otp;
    delete userData.otpExpiry;

    success(res, { token, user: userData }, 'OTP verified successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/forgot-password
// Body: { email }
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required', 400);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return error(res, 'No account found with this email', 404);

    const otp = generateOTP();
    user.resetPasswordToken = otp;
    user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    await sendMail({
      to: user.email,
      subject: '🔐 Password Reset OTP — JustService24',
      html: wrap(`
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:56px">🔐</div>
          <h1 style="color:#1e293b;font-size:24px;margin:12px 0 6px">Password Reset OTP</h1>
          <p style="color:#64748b;font-size:15px;margin:0">Hi ${user.name || 'User'}, use the OTP below to reset your password</p>
        </div>
        <div style="text-align:center;margin:28px 0">
          <div style="display:inline-block;background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:20px 40px">
            <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#16a34a">${otp}</div>
          </div>
        </div>
        <p style="color:#475569;font-size:14px;text-align:center">This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
        <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;margin-top:20px">
          <p style="margin:0;color:#dc2626;font-size:13px">⚠️ If you didn't request this, please ignore this email.</p>
        </div>
      `),
    });

    success(res, null, 'OTP sent to your email successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/reset-password
// Body: { email, otp, password }
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return error(res, 'Email, OTP and new password are required', 400);
    if (password.length < 6) return error(res, 'Password must be at least 6 characters', 400);

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: otp.trim(),
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) return error(res, 'Invalid or expired OTP', 400);

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    success(res, null, 'Password reset successfully. Please login with your new password.');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/send-change-password-otp  (authenticated)
exports.sendChangePasswordOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, 'User not found', 404);
    if (!user.email) return error(res, 'No email address found on your profile', 400);

    const otp = generateOTP();
    user.changePasswordOtp = otp;
    user.changePasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendMail({
      to: user.email,
      subject: '🔐 Password Change OTP — JustService24',
      html: wrap(`
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:56px">🔐</div>
          <h1 style="color:#1e293b;font-size:24px;margin:12px 0 6px">Change Password OTP</h1>
          <p style="color:#64748b;font-size:15px;margin:0">Hi ${user.name || 'User'}, use the OTP below to change your password</p>
        </div>
        <div style="text-align:center;margin:28px 0">
          <div style="display:inline-block;background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;padding:20px 40px">
            <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#16a34a">${otp}</div>
          </div>
        </div>
        <p style="color:#475569;font-size:14px;text-align:center">This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
      `),
    });

    success(res, null, 'OTP sent to your email successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/change-password  (authenticated)
// Body: { otp, newPassword }
exports.changePassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) return error(res, 'OTP and new password are required', 400);
    if (newPassword.length < 6) return error(res, 'New password must be at least 6 characters', 400);

    const user = await User.findById(req.user.id);
    if (!user) return error(res, 'User not found', 404);
    if (!user.changePasswordOtp || user.changePasswordOtp !== otp.trim()) return error(res, 'Invalid OTP', 400);
    if (user.changePasswordOtpExpiry < new Date()) return error(res, 'OTP expired. Please request a new one', 400);

    user.password = await bcrypt.hash(newPassword, 12);
    user.changePasswordOtp = undefined;
    user.changePasswordOtpExpiry = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    success(res, null, 'Password changed successfully. Please login again.');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/auth/create-admin  (one-time use)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, secretKey } = req.body;
    if (secretKey !== process.env.ADMIN_SECRET_KEY) return error(res, 'Invalid secret key', 403);

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await User.findOneAndUpdate(
      { email },
      { name, phone, password: hashedPassword, role: 'admin' },
      { upsert: true, new: true }
    );

    const userData = admin.toObject();
    delete userData.password;
    success(res, userData, 'Admin created successfully', 201);
  } catch (e) {
    error(res, e.message);
  }
};
