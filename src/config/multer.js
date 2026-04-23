const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});

const fileFilter = (req, file, cb) => {
  const isImage = /jpeg|jpg|png|webp/.test(file.mimetype);
  const isPDF = file.mimetype === 'application/pdf';
  if (isImage || isPDF) cb(null, true);
  else cb(new Error('Only images and PDF allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = upload;
