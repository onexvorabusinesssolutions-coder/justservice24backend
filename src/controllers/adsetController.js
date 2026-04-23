const AdSet = require('../models/AdSet');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { success, error } = require('../utils/response');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /api/adsets — public (active only)
exports.getActive = async (req, res) => {
  try {
    const { category, district, bannerPosition } = req.query;
    const filter = { status: 'approved', isActive: true };
    if (category) filter.category = category;
    if (district) filter.district = district;
    if (bannerPosition) filter.bannerPosition = bannerPosition;
    const adsets = await AdSet.find(filter).sort({ createdAt: -1 });
    success(res, adsets);
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/adsets/create-order — create Razorpay order
exports.createOrder = async (req, res) => {
  try {
    const { fullName, phone, email, businessName, adPlacement, duration, bannerPosition, category, amount } = req.body;

    if (!fullName?.trim()) return error(res, 'Full name is required', 400);
    if (!phone?.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) return error(res, 'Valid 10-digit phone number is required', 400);
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return error(res, 'Valid email is required', 400);
    if (!businessName?.trim()) return error(res, 'Business name is required', 400);
    if (!adPlacement || !['Dashboard', 'Category'].includes(adPlacement)) return error(res, 'Ad placement is required', 400);
    if (!duration || !['1 Month', '3 Months'].includes(duration)) return error(res, 'Duration is required', 400);
    if (adPlacement === 'Dashboard' && !bannerPosition?.trim()) return error(res, 'Banner position is required', 400);
    if (adPlacement === 'Category' && !category?.trim()) return error(res, 'Category is required', 400);
    if (!amount || isNaN(amount) || Number(amount) <= 0) return error(res, 'Invalid amount', 400);

    const order = await getRazorpay().orders.create({
      amount: Number(amount) * 100, // paise
      currency: 'INR',
      receipt: `adset_${Date.now()}`,
    });

    success(res, { orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/adsets — user (submit ad after payment)
exports.create = async (req, res) => {
  try {
    const { fullName, phone, email, businessName, adPlacement, duration, bannerPosition, category,
      razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!fullName?.trim()) return error(res, 'Full name is required', 400);
    if (!phone?.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) return error(res, 'Valid 10-digit phone number is required', 400);
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return error(res, 'Valid email is required', 400);
    if (!businessName?.trim()) return error(res, 'Business name is required', 400);
    if (!adPlacement || !['Dashboard', 'Category'].includes(adPlacement)) return error(res, 'Ad placement is required', 400);
    if (!duration || !['1 Month', '3 Months'].includes(duration)) return error(res, 'Duration is required', 400);
    if (adPlacement === 'Dashboard' && !bannerPosition?.trim()) return error(res, 'Banner position is required', 400);
    if (adPlacement === 'Category' && !category?.trim()) return error(res, 'Category is required', 400);
    if (!req.file) return error(res, 'Ad image is required', 400);

    // Verify Razorpay signature (skip in test/dev mode)
    const isTestMode = process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') &&
      process.env.RAZORPAY_KEY_SECRET === 'thiIsAFakeTestSecretKey123456';

    if (!isTestMode) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return error(res, 'Payment verification failed. Please complete payment first.', 400);
      }
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (expectedSig !== razorpay_signature) return error(res, 'Payment signature invalid', 400);
    }

    const image = req.file.path;
    const ad = await AdSet.create({
      ...req.body,
      userId: req.user.id,
      image,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
    success(res, ad, 'Ad submitted successfully. Pending approval.', 201);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/adsets/my — user (own ads)
exports.getMyAds = async (req, res) => {
  try {
    const ads = await AdSet.find({ userId: req.user.id }).sort({ createdAt: -1 });
    success(res, ads);
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---

exports.getAllAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [adsets, total] = await Promise.all([
      AdSet.find(filter).populate('userId', 'name phone email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
      AdSet.countDocuments(filter),
    ]);
    success(res, { adsets, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) return error(res, 'Invalid status', 400);
    const ad = await AdSet.findByIdAndUpdate(
      req.params.id,
      { status, isActive: status === 'approved' },
      { new: true }
    );
    if (!ad) return error(res, 'Ad not found', 404);
    success(res, ad, `Ad ${status} successfully`);
  } catch (e) {
    error(res, e.message);
  }
};

exports.delete = async (req, res) => {
  try {
    await AdSet.findByIdAndDelete(req.params.id);
    success(res, null, 'Ad deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/adsets/webhook — Razorpay webhook
exports.razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(200).json({ received: true });

    const signature = req.headers['x-razorpay-signature'];
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSig) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && payment) {
      await AdSet.findOneAndUpdate(
        { orderId: payment.order_id },
        { paymentStatus: 'captured', paymentId: payment.id }
      );
    } else if (event === 'payment.failed' && payment) {
      await AdSet.findOneAndUpdate(
        { orderId: payment.order_id },
        { paymentStatus: 'failed' }
      );
    }

    res.status(200).json({ received: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
