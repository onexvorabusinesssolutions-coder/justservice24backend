const Razorpay = require('razorpay');
const crypto = require('crypto');
const Certificate = require('../models/Certificate');
const Business = require('../models/Business');
const { success, error } = require('../utils/response');

const DIGITAL_PRICE = 99;   // ₹99 for digital download
const DELIVERY_PER_KM = 15; // ₹15 per km

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const isTestMode = () =>
  !process.env.RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET ||
  process.env.RAZORPAY_KEY_SECRET === 'thiIsAFakeTestSecretKey123456';

// POST /api/certificates/create-order
exports.createOrder = async (req, res) => {
  try {
    const { businessId, type, km, deliveryAddress } = req.body;

    if (!businessId) return error(res, 'businessId is required', 400);
    if (!['digital', 'delivery'].includes(type)) return error(res, 'type must be digital or delivery', 400);

    const biz = await Business.findById(businessId);
    if (!biz) return error(res, 'Business not found', 404);
    if (biz.userId.toString() !== req.user.id) return error(res, 'Unauthorized', 403);

    let amount = DIGITAL_PRICE;
    let deliveryCharge = 0;

    if (type === 'delivery') {
      if (!km || isNaN(km) || Number(km) <= 0) return error(res, 'km is required for delivery', 400);
      if (!deliveryAddress?.trim()) return error(res, 'deliveryAddress is required', 400);
      deliveryCharge = Math.ceil(Number(km)) * DELIVERY_PER_KM;
      amount = DIGITAL_PRICE + deliveryCharge;
    }

    // Test mode: skip Razorpay, auto-mark paid
    if (isTestMode()) {
      const cert = await Certificate.create({
        userId: req.user.id,
        businessId,
        type,
        orderId: `cert_test_${Date.now()}`,
        paymentId: `pay_test_${Date.now()}`,
        amount,
        status: 'paid',
        deliveryAddress: deliveryAddress || '',
        km: km ? Number(km) : 0,
        deliveryCharge,
      });
      return success(res, {
        orderId: cert.orderId,
        amount: amount * 100,
        currency: 'INR',
        certId: cert._id,
        testMode: true,
        breakdown: { digitalPrice: DIGITAL_PRICE, deliveryCharge, total: amount },
      });
    }

    const order = await getRazorpay().orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `cert_${Date.now()}`,
    });

    const cert = await Certificate.create({
      userId: req.user.id,
      businessId,
      type,
      orderId: order.id,
      amount,
      status: 'pending',
      deliveryAddress: deliveryAddress || '',
      km: km ? Number(km) : 0,
      deliveryCharge,
    });

    success(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      certId: cert._id,
      testMode: false,
      breakdown: { digitalPrice: DIGITAL_PRICE, deliveryCharge, total: amount },
    });
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/certificates/verify-payment
exports.verifyPayment = async (req, res) => {
  try {
    const { certId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!certId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return error(res, 'All payment fields are required', 400);
    }

    const cert = await Certificate.findById(certId);
    if (!cert) return error(res, 'Certificate not found', 404);
    if (cert.userId.toString() !== req.user.id) return error(res, 'Unauthorized', 403);

    // Verify signature — skip in test mode
    if (!isTestMode()) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (expectedSig !== razorpay_signature) return error(res, 'Payment signature invalid', 400);
    }

    cert.paymentId = razorpay_payment_id;
    cert.status = 'paid';
    await cert.save();

    const populated = await Certificate.findById(cert._id).populate('businessId', 'businessName category subCategory fullAddress address district state rating reviews logo status');
    success(res, populated, 'Payment verified successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/certificates/my
exports.getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user.id })
      .populate('businessId', 'businessName category subCategory fullAddress address district state rating reviews logo status businessType categories')
      .sort({ createdAt: -1 });
    success(res, certs);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/certificates/price-info
exports.getPriceInfo = async (req, res) => {
  success(res, { digitalPrice: DIGITAL_PRICE, deliveryPerKm: DELIVERY_PER_KM });
};
