const Business = require('../models/Business');
const User = require('../models/User');
const notify = require('../utils/notify');
const { success, error } = require('../utils/response');
const { sendMail, wrap, businessApprovedMail, businessRejectedMail, businessGrowthMail, MILESTONES } = require('../utils/mailer');

// POST /api/businesses — user submit business
exports.create = async (req, res) => {
  try {
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

    const logo = req.files?.logo?.[0]?.path || body.logo || null;
    const images = req.files?.images?.map(f => f.path) || [];
    const brochure = req.files?.brochure?.[0]?.path || null;
    const productImages = req.files?.productImages?.map(f => f.path) || [];

    // Parse JSON string fields
    const categories = typeof body.categories === 'string' ? JSON.parse(body.categories) : (body.categories || []);
    const subCategories = typeof body.subCategories === 'string' ? JSON.parse(body.subCategories) : (body.subCategories || {});
    const paymentModes = typeof body.paymentModes === 'string' ? JSON.parse(body.paymentModes) : (body.paymentModes || []);
    const hours = typeof body.hours === 'string' ? JSON.parse(body.hours) : (body.hours || {});
    const services = typeof body.services === 'string' ? JSON.parse(body.services) : (body.services || []);
    const products = typeof body.products === 'string' ? JSON.parse(body.products) : (body.products || []);

    // Attach product images by index
    const productsWithImages = products.map((p, i) => ({ ...p, image: productImages[i] || p.image || null }));

    // Calculate profile completion %
    const fields = ['businessName', 'phone', 'email', 'fullAddress', 'description', 'logo', 'categories'];
    let filled = fields.filter(f =>
      body[f] || (f === 'logo' && logo) || (f === 'categories' && categories.length)
    ).length;
    const profilePct = Math.round((filled / fields.length) * 100);

    const b = await Business.create({
      ...body,
      userId: req.user.id,
      logo,
      images,
      brochure,
      categories,
      subCategories,
      paymentModes,
      hours,
      services,
      products: productsWithImages,
      address: body.fullAddress || body.address || '',
      profilePct,
    });
    success(res, b, 'Business submitted successfully. Pending approval.', 201);
    // Notify business owner
    await notify({ userId: req.user.id, type: 'new_business', title: 'Business Submitted! 🏢', message: `Your business "${body.businessName}" has been submitted and is pending approval.`, icon: '🏢', link: '/my-business' });
    // Public notification
    await notify({ userId: null, type: 'new_business', title: 'New Business Listed! 🎉', message: `A new business "${body.businessName}" has been listed on JustService24!`, icon: '🏢', isPublic: true });
    // Congratulations mail to business owner
    const submitter = await User.findById(req.user.id).select('email name');
    if (submitter?.email) {
      await sendMail({
        to: submitter.email,
        subject: `🎊 Welcome to JustService24! Your Business "${body.businessName}" is Submitted`,
        html: require('../utils/mailer').wrap(`
          <div style="text-align:center;margin-bottom:28px">
            <div style="font-size:56px">🎊</div>
            <h1 style="color:#16a34a;font-size:26px;margin:12px 0 6px">Welcome, ${submitter.name || 'User'}!</h1>
            <p style="color:#64748b;font-size:15px;margin:0">Your business has been successfully submitted</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
            <p style="margin:0;color:#15803d;font-size:16px;font-weight:600">🏢 ${body.businessName}</p>
            <p style="margin:6px 0 0;color:#16a34a;font-size:13px">Status: ⏳ Under Review</p>
          </div>
          <p style="color:#475569;font-size:15px;line-height:1.7">
            Congratulations on taking the first step! Your business <b>${body.businessName}</b> has been received and is currently under review by our team. We'll notify you once it goes live.
          </p>
          <div style="background:#fafafa;border-radius:12px;padding:20px 24px;margin:24px 0">
            <p style="margin:0 0 12px;color:#1e293b;font-weight:700;font-size:15px">⏱️ What happens next?</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#475569;font-size:14px">1️⃣ &nbsp;Our team reviews your business details</td></tr>
              <tr><td style="padding:6px 0;color:#475569;font-size:14px">2️⃣ &nbsp;You'll receive an approval email within 24 hours</td></tr>
              <tr><td style="padding:6px 0;color:#475569;font-size:14px">3️⃣ &nbsp;Once approved, your business goes live instantly</td></tr>
              <tr><td style="padding:6px 0;color:#475569;font-size:14px">4️⃣ &nbsp;Customers can find & contact you directly</td></tr>
            </table>
          </div>
          <div style="text-align:center;margin-top:28px">
            <a href="https://justservice24.com/my-business"
               style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700">
              Track My Business →
            </a>
          </div>
        `),
      });
    }
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/businesses/my — user apne businesses
exports.getMyBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({ userId: req.user.id }).sort({ createdAt: -1 });
    success(res, businesses);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/businesses — public approved list
exports.getApproved = async (req, res) => {
  try {
    const { category, subCategory, city, search, sortBy, businessType, minRating, page = 1, limit = 20 } = req.query;
    const filter = { status: 'approved', isActive: true };

    if (category && subCategory) {
      filter.$or = [
        { category, subCategory },
        { categories: { $in: [category] } },
        { [`subCategories.${category}`]: { $in: [subCategory] } },
        { 'subCategories': { $elemMatch: { $eq: subCategory } } },
      ];
    } else if (category) {
      filter.$or = [
        { category },
        { categories: { $in: [category] } },
      ];
    }

    if (city) filter.city = { $regex: city, $options: 'i' };
    if (search) filter.businessName = { $regex: search, $options: 'i' };
    if (businessType) filter.businessType = { $regex: businessType, $options: 'i' };
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    let sortOpt = { createdAt: -1 };
    if (sortBy === 'rating') sortOpt = { rating: -1 };
    else if (sortBy === 'newest') sortOpt = { createdAt: -1 };
    else if (sortBy === 'popular') sortOpt = { totalClicks: -1 };

    const [businesses, total] = await Promise.all([
      Business.find(filter).sort(sortOpt).skip((page - 1) * limit).limit(+limit),
      Business.countDocuments(filter),
    ]);
    success(res, { businesses, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/businesses/suggestions — search autocomplete
exports.getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return success(res, []);
    const businesses = await Business.find(
      { status: 'approved', isActive: true, businessName: { $regex: q.trim(), $options: 'i' } },
      { businessName: 1, city: 1, businessType: 1 }
    ).limit(8);
    success(res, businesses);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/businesses/:id — public single business
exports.getById = async (req, res) => {
  try {
    const b = await Business.findByIdAndUpdate(
      req.params.id,
      { $inc: { totalClicks: 1 } },
      { new: true }
    );
    if (!b) return error(res, 'Business not found', 404);
    success(res, b);
    // Growth milestone check for clicks
    if (MILESTONES.clicks.includes(b.totalClicks)) {
      const owner = await User.findById(b.userId).select('email name');
      if (owner?.email) {
        const mail = businessGrowthMail({ name: owner.name || 'User', businessName: b.businessName, businessId: b._id, type: 'clicks', count: b.totalClicks });
        await sendMail({ to: owner.email, ...mail });
      }
    }
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/businesses/:id/review — user review submit
exports.addReview = async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    const review = { name, rating, comment, date: 'Just now' };
    const b = await Business.findByIdAndUpdate(
      req.params.id,
      { $push: { reviewsList: review }, $inc: { reviews: 1 } },
      { new: true }
    );
    // Recalculate average rating
    const avg = b.reviewsList.reduce((sum, r) => sum + r.rating, 0) / b.reviewsList.length;
    b.rating = Math.round(avg * 10) / 10;
    await b.save();
    success(res, b, 'Review submitted successfully');
    await notify({ userId: b.userId, type: 'new_review', title: 'New Review Received! ⭐', message: `${name} gave ${rating} stars to "${b.businessName}": "${comment}"`, icon: '⭐', link: `/business/${b._id}` });
    // Growth milestone check for reviews
    if (MILESTONES.reviews.includes(b.reviews)) {
      const owner = await User.findById(b.userId).select('email name');
      if (owner?.email) {
        const mail = businessGrowthMail({ name: owner.name || 'User', businessName: b.businessName, businessId: b._id, type: 'reviews', count: b.reviews });
        await sendMail({ to: owner.email, ...mail });
      }
    }
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/businesses/:id/reviews — paginated reviews list
exports.getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const b = await Business.findById(req.params.id).select('reviewsList businessName');
    if (!b) return error(res, 'Business not found', 404);
    const total = b.reviewsList.length;
    const reviews = b.reviewsList.slice((page - 1) * limit, page * limit);
    success(res, { reviews, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

// POST /api/businesses/:id/enquiry — track enquiry
exports.trackEnquiry = async (req, res) => {
  try {
    const b = await Business.findByIdAndUpdate(req.params.id, { $inc: { totalEnquiries: 1 } }, { new: true });
    success(res, null, 'Enquiry tracked');
    // Growth milestone check
    if (MILESTONES.enquiries.includes(b.totalEnquiries)) {
      const owner = await User.findById(b.userId).select('email name');
      if (owner?.email) {
        const mail = businessGrowthMail({ name: owner.name || 'User', businessName: b.businessName, businessId: b._id, type: 'enquiries', count: b.totalEnquiries });
        await sendMail({ to: owner.email, ...mail });
      }
    }
  } catch (e) {
    error(res, e.message);
  }
};

// PUT /api/businesses/:id — user apna business update kare
exports.update = async (req, res) => {
  try {
    const biz = await Business.findOne({ _id: req.params.id, userId: req.user.id });
    if (!biz) return error(res, 'Business not found', 404);

    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

    const logo = req.files?.logo?.[0]?.path || biz.logo;
    const newImages = req.files?.images?.map(f => f.path) || [];
    const images = newImages.length ? [...biz.images, ...newImages].slice(0, 5) : biz.images;
    const brochure = req.files?.brochure?.[0]?.path || biz.brochure;

    const parse = (val, fallback) => {
      if (!val) return fallback;
      return typeof val === 'string' ? JSON.parse(val) : val;
    };

    const categories = parse(body.categories, biz.categories);
    const subCategories = parse(body.subCategories, biz.subCategories);
    const paymentModes = parse(body.paymentModes, biz.paymentModes);
    const hours = parse(body.hours, biz.hours);
    const services = parse(body.services, biz.services);
    const products = parse(body.products, biz.products);

    const updated = await Business.findByIdAndUpdate(
      req.params.id,
      { ...body, logo, images, brochure, categories, subCategories, paymentModes, hours, services, products, address: body.fullAddress || body.address || biz.address },
      { new: true }
    );
    success(res, updated, 'Business updated successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---

exports.getAllAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const [businesses, total] = await Promise.all([
      Business.find(filter).populate('userId', 'name phone email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(+limit),
      Business.countDocuments(filter),
    ]);
    success(res, { businesses, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/businesses/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, topRated, mostViewed] = await Promise.all([
      Business.countDocuments(),
      Business.countDocuments({ status: 'pending' }),
      Business.countDocuments({ status: 'approved' }),
      Business.countDocuments({ status: 'rejected' }),
      Business.find({ status: 'approved' }).sort({ rating: -1 }).limit(5).select('businessName rating reviews city'),
      Business.find({ status: 'approved' }).sort({ totalClicks: -1 }).limit(5).select('businessName totalClicks city'),
    ]);
    success(res, { total, pending, approved, rejected, topRated, mostViewed });
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/businesses/admin/enquiries
exports.getEnquiriesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [businesses, total] = await Promise.all([
      Business.find({ totalEnquiries: { $gt: 0 } })
        .select('businessName totalEnquiries totalClicks totalCalls city status')
        .sort({ totalEnquiries: -1 })
        .skip((page - 1) * limit)
        .limit(+limit),
      Business.countDocuments({ totalEnquiries: { $gt: 0 } }),
    ]);
    success(res, { businesses, total, page: +page, limit: +limit });
  } catch (e) {
    error(res, e.message);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) return error(res, 'Invalid status', 400);
    const b = await Business.findByIdAndUpdate(
      req.params.id,
      { status, isActive: status === 'approved' },
      { new: true }
    );
    if (!b) return error(res, 'Business not found', 404);
    // Notify business owner
    const owner = await User.findById(b.userId).select('email name');
    if (status === 'approved') {
      await notify({ userId: b.userId, type: 'business_approved', title: 'Business Approved! ✅', message: `Congratulations! Your business "${b.businessName}" has been approved and is now live.`, icon: '✅', link: `/business/${b._id}` });
      if (owner?.email) {
        const mail = businessApprovedMail({ name: owner.name || 'User', businessName: b.businessName, businessId: b._id });
        await sendMail({ to: owner.email, ...mail });
      }
    } else if (status === 'rejected') {
      await notify({ userId: b.userId, type: 'business_rejected', title: 'Business Rejected ❌', message: `Your business "${b.businessName}" was not approved. Please contact support for more info.`, icon: '❌', link: '/support' });
      if (owner?.email) {
        const mail = businessRejectedMail({ name: owner.name || 'User', businessName: b.businessName });
        await sendMail({ to: owner.email, ...mail });
      }
    }
    success(res, b, `Business ${status} successfully`);
  } catch (e) {
    error(res, e.message);
  }
};

exports.delete = async (req, res) => {
  try {
    await Business.findByIdAndDelete(req.params.id);
    success(res, null, 'Business deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};
