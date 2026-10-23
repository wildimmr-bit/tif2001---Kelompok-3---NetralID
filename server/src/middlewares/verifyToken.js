const { verifyToken: verifyJwt } = require('../utils/auth');

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    req.user = verifyJwt(header.split(' ')[1]);
    next();
  } catch {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
};

module.exports = verifyToken;