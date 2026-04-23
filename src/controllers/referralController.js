const Referral = require('../models/Referral');
const RedeemHistory = require('../models/RedeemHistory');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { success, error } = require('../utils/response');

// GET /api/referrals/my
exports.getMy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('referralCode phone');
    const referral = await Referral.findOne({ userId: req.user.id })
      .populate('referredUsers', 'name phone createdAt');

    success(res, {
      referralCode: user?.referralCode || `JUSTSERVICE${user?.phone?.slice(-4) || '0000'}`,
      balance: referral?.balance || 0,
      totalEarned: referral?.totalEarned || 0,
      redeemed: referral?.redeemed || 0,
      referredUsers: referral?.referredUsers || [],
    });
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/referrals/redeem
exports.redeem = async (req, res) => {
  try {
    const { type } = req.body; // 'bonanza' or 'lottery'
    const redeemType = ['bonanza', 'lottery'].includes(type) ? type : 'bonanza';

    const settings = await Settings.findOne();
    const minRedeem = settings?.minRedeemAmount || 10;

    const referral = await Referral.findOne({ userId: req.user.id });
    if (!referral) return error(res, 'No referral data found', 404);

    const requiredCoins = redeemType === 'lottery' ? 500 : 10;
    if (referral.balance < requiredCoins) {
      return error(res, `You need ${requiredCoins} coins to redeem this reward`, 400);
    }

    referral.redeemed += requiredCoins;
    referral.balance -= requiredCoins;
    await referral.save();

    // Save history
    await RedeemHistory.create({
      userId: req.user.id,
      amount: requiredCoins,
      coins: requiredCoins,
      type: redeemType,
      status: 'pending',
    });

    success(res, {
      balance: referral.balance,
      redeemed: referral.redeemed,
    }, `${requiredCoins} coins redeemed successfully`);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/referrals/redeem-history
exports.getRedeemHistory = async (req, res) => {
  try {
    const history = await RedeemHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    success(res, history);
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---
exports.getAllAdmin = async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 });
    success(res, referrals);
  } catch (e) {
    error(res, e.message);
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await Referral.countDocuments();
    const agg = await Referral.aggregate([{
      $group: {
        _id: null,
        totalEarned: { $sum: '$totalEarned' },
        totalRedeemed: { $sum: '$redeemed' },
        totalBalance: { $sum: '$balance' },
      }
    }]);
    success(res, { total, ...(agg[0] || { totalEarned: 0, totalRedeemed: 0, totalBalance: 0 }) });
  } catch (e) {
    error(res, e.message);
  }
};
