const Support = require('../models/Support');
const User = require('../models/User');
const { success, error } = require('../utils/response');
const { sendMail } = require('../utils/mailer');

// POST /api/support — user ticket submit
// Frontend fields: title (subject), desc (message), userType
exports.create = async (req, res) => {
  try {
    const { title, desc, message, subject, userType, name, phone, email } = req.body;
    const ticket = await Support.create({
      userId: req.user?.id || null,
      name: name || null,
      phone: phone || null,
      email: email || null,
      subject: title || subject || 'Support Request',
      message: desc || message,
      userType,
    });
    success(res, ticket, 'Support ticket submitted successfully', 201);
  } catch (e) {
    error(res, e.message);
  }
};

// GET /api/support/my — user apne tickets
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Support.find({ userId: req.user.id }).sort({ createdAt: -1 });
    success(res, tickets);
  } catch (e) {
    error(res, e.message);
  }
};

// PATCH /api/support/my/:id/close — user apna ticket close kare
exports.closeTicket = async (req, res) => {
  try {
    const ticket = await Support.findOne({ _id: req.params.id, userId: req.user.id });
    if (!ticket) return error(res, 'Ticket not found', 404);
    if (ticket.status === 'resolved') return error(res, 'Ticket is already resolved', 400);
    ticket.status = 'resolved';
    await ticket.save();
    success(res, ticket, 'Ticket closed successfully');
  } catch (e) {
    error(res, e.message);
  }
};

// --- ADMIN ---

exports.getAllAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const tickets = await Support.find(filter).populate('userId', 'name phone email').sort({ createdAt: -1 });
    success(res, tickets);
  } catch (e) {
    error(res, e.message);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, reply } = req.body;
    const ticket = await Support.findByIdAndUpdate(req.params.id, { status, reply }, { new: true });
    if (!ticket) return error(res, 'Ticket not found', 404);
    success(res, ticket, 'Ticket updated successfully');

    // Send reply email to user
    if (reply) {
      let userEmail = ticket.email;
      if (!userEmail && ticket.userId) {
        const user = await User.findById(ticket.userId).select('email');
        userEmail = user?.email;
      }
      if (userEmail) {
        await sendMail({
          to: userEmail,
          subject: `Reply to your support ticket: ${ticket.subject}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:auto">
              <h2 style="color:#16a34a">JustService24 Support</h2>
              <p>Hi, we have replied to your support ticket.</p>
              <p><b>Subject:</b> ${ticket.subject}</p>
              <p><b>Your Message:</b> ${ticket.message}</p>
              <hr/>
              <p><b>Our Reply:</b></p>
              <p style="background:#f0fdf4;padding:12px;border-radius:8px">${reply}</p>
              <p style="color:#6b7280;font-size:12px">Status: ${status}</p>
              <p style="color:#6b7280;font-size:12px">Team JustService24</p>
            </div>`,
        });
      }
    }
  } catch (e) {
    error(res, e.message);
  }
};

exports.delete = async (req, res) => {
  try {
    await Support.findByIdAndDelete(req.params.id);
    success(res, null, 'Ticket deleted successfully');
  } catch (e) {
    error(res, e.message);
  }
};
