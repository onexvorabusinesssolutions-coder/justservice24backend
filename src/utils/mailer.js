const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async ({ to, subject, html }) => {
  if (!to || !process.env.MAIL_USER) return;
  try {
    await transporter.sendMail({
      from: `"JustService24" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error('Mail error:', e.message);
  }
};

const wrap = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:1px">JustService<span style="color:#bbf7d0">24</span></div>
            <div style="color:#bbf7d0;font-size:13px;margin-top:4px">Your Business Growth Partner</div>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <div style="color:#94a3b8;font-size:12px;line-height:1.8">
              © 2024 JustService24. All rights reserved.<br/>
              <a href="https://justservice24.com" style="color:#16a34a;text-decoration:none">justservice24.com</a> &nbsp;|&nbsp;
              <a href="mailto:support@justservice24.com" style="color:#16a34a;text-decoration:none">support@justservice24.com</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ✅ Business Approved
const businessApprovedMail = ({ name, businessName, businessId }) => ({
  subject: `🎉 Congratulations! Your Business is Now Live on JustService24`,
  html: wrap(`
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:56px">🎉</div>
      <h1 style="color:#16a34a;font-size:26px;margin:12px 0 6px">Congratulations, ${name}!</h1>
      <p style="color:#64748b;font-size:15px;margin:0">Your business is officially live!</p>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <p style="margin:0;color:#15803d;font-size:16px;font-weight:600">🏢 ${businessName}</p>
      <p style="margin:6px 0 0;color:#16a34a;font-size:13px">Status: ✅ Approved & Live</p>
    </div>
    <p style="color:#475569;font-size:15px;line-height:1.7">
      We're thrilled to welcome <b>${businessName}</b> to the JustService24 family! 
      Your business is now visible to thousands of customers searching for services like yours.
    </p>
    <div style="background:#fafafa;border-radius:12px;padding:20px 24px;margin:24px 0">
      <p style="margin:0 0 12px;color:#1e293b;font-weight:700;font-size:15px">🚀 What's Next?</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">✅ &nbsp;Add high-quality photos to attract more customers</td></tr>
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">✅ &nbsp;Complete your business profile (100% = more visibility)</td></tr>
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">✅ &nbsp;Share your listing on social media</td></tr>
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">✅ &nbsp;Encourage customers to leave reviews</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-top:28px">
      <a href="https://justservice24.com/business/${businessId}" 
         style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700;letter-spacing:0.5px">
        View My Business →
      </a>
    </div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;margin-top:24px">
      Need help? Reply to this email or visit our <a href="https://justservice24.com/support" style="color:#16a34a">Support Center</a>
    </p>
  `),
});

// ❌ Business Rejected
const businessRejectedMail = ({ name, businessName }) => ({
  subject: `Update on your business "${businessName}" — JustService24`,
  html: wrap(`
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:56px">📋</div>
      <h1 style="color:#dc2626;font-size:24px;margin:12px 0 6px">Application Update</h1>
      <p style="color:#64748b;font-size:15px;margin:0">Hi ${name}, we have an update for you</p>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <p style="margin:0;color:#dc2626;font-size:16px;font-weight:600">🏢 ${businessName}</p>
      <p style="margin:6px 0 0;color:#ef4444;font-size:13px">Status: Not Approved at this time</p>
    </div>
    <p style="color:#475569;font-size:15px;line-height:1.7">
      Thank you for submitting your business. After review, we were unable to approve <b>${businessName}</b> at this time. 
      This could be due to incomplete information or not meeting our listing guidelines.
    </p>
    <div style="background:#fafafa;border-radius:12px;padding:20px 24px;margin:24px 0">
      <p style="margin:0 0 12px;color:#1e293b;font-weight:700;font-size:15px">💡 Common Reasons & How to Fix:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">📸 &nbsp;Add a clear business logo and photos</td></tr>
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">📝 &nbsp;Write a detailed business description</td></tr>
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">📍 &nbsp;Provide complete address details</td></tr>
        <tr><td style="padding:6px 0;color:#475569;font-size:14px">📞 &nbsp;Verify your contact information</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin-top:28px">
      <a href="https://justservice24.com/my-business" 
         style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700">
        Update & Resubmit →
      </a>
    </div>
  `),
});

// 📈 Growth Milestone Mail
const MILESTONES = {
  clicks:     [10, 50, 100, 500, 1000],
  enquiries:  [5, 25, 50, 100, 500],
  reviews:    [1, 5, 10, 25, 50],
};

const milestoneConfig = {
  clicks: {
    emoji: '👀',
    label: 'Profile Views',
    msgs: {
      10:   { badge: '🌱 Rising Star',      line: 'Your business is getting noticed! 10 people have already viewed your profile.' },
      50:   { badge: '🔥 Getting Popular',  line: '50 views! Your business is gaining great traction on JustService24.' },
      100:  { badge: '💯 Century Club',     line: 'Amazing! 100 people have viewed your business. You\'re on fire!' },
      500:  { badge: '⭐ Top Performer',    line: '500 views! You\'re among the top businesses on JustService24.' },
      1000: { badge: '🏆 Elite Business',   line: '1000 views milestone! You\'re a JustService24 Elite Business now!' },
    },
  },
  enquiries: {
    emoji: '📩',
    label: 'Customer Enquiries',
    msgs: {
      5:   { badge: '📬 First Leads',       line: '5 customers have enquired about your business. Great start!' },
      25:  { badge: '📈 Lead Magnet',       line: '25 enquiries! Customers love what you offer.' },
      50:  { badge: '🎯 Demand Rising',     line: '50 enquiries! Your business is in high demand.' },
      100: { badge: '💼 Business Booming',  line: '100 enquiries milestone! Your business is truly booming.' },
      500: { badge: '🚀 Market Leader',     line: '500 enquiries! You\'re a market leader on JustService24.' },
    },
  },
  reviews: {
    emoji: '⭐',
    label: 'Customer Reviews',
    msgs: {
      1:  { badge: '🌟 First Review',       line: 'You got your first customer review! This builds trust with new customers.' },
      5:  { badge: '⭐ Trusted Business',   line: '5 reviews! Customers trust your business. Keep up the great work!' },
      10: { badge: '🏅 Review Champion',    line: '10 reviews! You\'re building an amazing reputation.' },
      25: { badge: '💎 Highly Rated',       line: '25 reviews! You\'re one of the most reviewed businesses.' },
      50: { badge: '👑 Review Royalty',     line: '50 reviews! Absolutely outstanding customer engagement!' },
    },
  },
};

const businessGrowthMail = ({ name, businessName, businessId, type, count }) => {
  const cfg = milestoneConfig[type];
  const { badge, line } = cfg.msgs[count];
  return {
    subject: `${cfg.emoji} ${badge} — ${businessName} just hit ${count} ${cfg.label}!`,
    html: wrap(`
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:60px">${cfg.emoji}</div>
        <div style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;padding:6px 18px;border-radius:50px;font-size:13px;font-weight:700;margin:12px 0">${badge}</div>
        <h1 style="color:#1e293b;font-size:24px;margin:10px 0 6px">Milestone Unlocked! 🎊</h1>
        <p style="color:#64748b;font-size:15px;margin:0">Congratulations, ${name}!</p>
      </div>
      <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-size:42px;font-weight:800;color:#16a34a">${count}</div>
        <div style="color:#15803d;font-size:16px;font-weight:600">${cfg.label}</div>
        <div style="color:#475569;font-size:13px;margin-top:4px">🏢 ${businessName}</div>
      </div>
      <p style="color:#475569;font-size:15px;line-height:1.7;text-align:center">${line}</p>
      <div style="background:#fafafa;border-radius:12px;padding:20px 24px;margin:24px 0">
        <p style="margin:0 0 12px;color:#1e293b;font-weight:700;font-size:15px">💡 Keep Growing:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;color:#475569;font-size:14px">📸 &nbsp;Add more photos to increase engagement</td></tr>
          <tr><td style="padding:6px 0;color:#475569;font-size:14px">🎯 &nbsp;Use AdSet to promote your business</td></tr>
          <tr><td style="padding:6px 0;color:#475569;font-size:14px">🔗 &nbsp;Share your profile link on WhatsApp & Social Media</td></tr>
          <tr><td style="padding:6px 0;color:#475569;font-size:14px">⭐ &nbsp;Ask happy customers to leave a review</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin-top:28px">
        <a href="https://justservice24.com/business/${businessId}" 
           style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700">
          View My Business →
        </a>
      </div>
    `),
  };
};

module.exports = { sendMail, wrap, businessApprovedMail, businessRejectedMail, businessGrowthMail, MILESTONES };
