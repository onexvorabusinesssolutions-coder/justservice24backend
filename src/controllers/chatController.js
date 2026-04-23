const Conversation = require('../models/Conversation');
const Business = require('../models/Business');
const notify = require('../utils/notify');
const { success, error } = require('../utils/response');

// POST /api/chat/start
exports.start = async (req, res) => {
  try {
    const { businessId, productName, firstMessage } = req.body;
    if (!businessId) return error(res, 'Business ID is required', 400);
    if (!firstMessage?.trim()) return error(res, 'First message is required', 400);

    const buyerId = req.user.id;
    const business = await Business.findById(businessId);
    if (!business) return error(res, 'Business not found', 404);

    const sellerId = business.userId;
    if (sellerId.toString() === buyerId.toString())
      return error(res, 'You cannot chat with your own business', 400);

    let conv = await Conversation.findOne({
      businessId, buyerId,
      productName: { $regex: `^${(productName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });

    if (!conv) {
      conv = await Conversation.create({
        businessId, buyerId, sellerId,
        productName: productName || '',
        lastMessage: firstMessage.trim(),
        lastAt: new Date(),
        messages: [{ senderId: buyerId, text: firstMessage.trim() }],
      });
    }

    success(res, conv, 'Conversation started');
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/chat/:convId/send
exports.send = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return error(res, 'Message cannot be empty', 400);

    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return error(res, 'Conversation not found', 404);

    const userId = req.user.id.toString();
    if (conv.buyerId.toString() !== userId && conv.sellerId.toString() !== userId)
      return error(res, 'Unauthorized', 403);

    conv.messages.push({ senderId: req.user.id, text: text.trim() });
    conv.lastMessage = text.trim();
    conv.lastAt = new Date();
    await conv.save();

    const receiverId = conv.buyerId.toString() === userId ? conv.sellerId : conv.buyerId;
    await notify({ userId: receiverId, type: 'new_message', title: 'New Message 💬', message: text.trim().slice(0, 80), icon: '💬', link: '/messages' });

    success(res, conv);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/chat
exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const convs = await Conversation.find({ $or: [{ buyerId: userId }, { sellerId: userId }] })
      .populate('businessId', 'businessName logo')
      .populate('buyerId', 'name avatar')
      .populate('sellerId', 'name avatar')
      .select('-messages')
      .sort({ lastAt: -1 });
    success(res, convs);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/chat/:convId
exports.getOne = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.convId)
      .populate('businessId', 'businessName logo')
      .populate('buyerId', 'name avatar')
      .populate('sellerId', 'name avatar');

    if (!conv) return error(res, 'Conversation not found', 404);

    const userId = req.user.id.toString();
    if (conv.buyerId._id.toString() !== userId && conv.sellerId._id.toString() !== userId)
      return error(res, 'Unauthorized', 403);

    success(res, conv);
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/chat/:convId/messages/:msgId
exports.deleteMessage = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return error(res, 'Conversation not found', 404);

    const userId = req.user.id.toString();
    if (conv.buyerId.toString() !== userId && conv.sellerId.toString() !== userId)
      return error(res, 'Unauthorized', 403);

    const msg = conv.messages.id(req.params.msgId);
    if (!msg) return error(res, 'Message not found', 404);
    if (msg.senderId.toString() !== userId) return error(res, 'You can only delete your own messages', 403);

    msg.deleteOne();
    // Update lastMessage if needed
    if (conv.messages.length > 0) {
      const last = conv.messages[conv.messages.length - 1];
      conv.lastMessage = last.text;
      conv.lastAt = last.createdAt;
    } else {
      conv.lastMessage = '';
    }
    await conv.save();
    success(res, null, 'Message deleted');
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/chat/:convId
exports.deleteConversation = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return error(res, 'Conversation not found', 404);

    const userId = req.user.id.toString();
    if (conv.buyerId.toString() !== userId && conv.sellerId.toString() !== userId)
      return error(res, 'Unauthorized', 403);

    await Conversation.findByIdAndDelete(req.params.convId);
    success(res, null, 'Conversation deleted');
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---

// GET /api/chat/admin/all
exports.getAllAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [convs, total] = await Promise.all([
      Conversation.find()
        .populate('businessId', 'businessName logo')
        .populate('buyerId', 'name phone')
        .populate('sellerId', 'name phone')
        .sort({ lastAt: -1 })
        .skip((page - 1) * limit)
        .limit(+limit)
        .lean(),
      Conversation.countDocuments(),
    ]);
    // messages remove karo response se (heavy data)
    const data = convs.map(({ messages, ...rest }) => rest);
    success(res, { conversations: data, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

// DELETE /api/chat/admin/:convId
exports.deleteConversationAdmin = async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.convId);
    success(res, null, 'Conversation deleted');
  } catch (e) {
    error(res, e.message);
  }
};
