const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const hashPassword = (plain) => bcrypt.hash(plain, 10)

const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed)

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  })

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET)

module.exports = { hashPassword, comparePassword, generateToken, verifyToken }