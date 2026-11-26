const multer = require('multer');

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Berkas hanya ditampung di memori (RAM), lalu diteruskan ke cloud storage.
// Folder lokal server tidak dipakai karena akan terhapus setiap server restart.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error('Tipe berkas tidak diizinkan');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error);
  },
});

// Kolom form yang dibaca bernama "image".
const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Ukuran gambar maksimal 2 MB' });
    }
    if (err.code === 'INVALID_FILE_TYPE') {
      return res.status(400).json({ message: 'Gambar harus berformat JPEG, PNG, atau WebP' });
    }
    return res.status(400).json({ message: 'Berkas tidak valid' });
  });
};

module.exports = uploadImage;
module.exports.MAX_BYTES = MAX_BYTES;
module.exports.ALLOWED_TYPES = ALLOWED_TYPES;