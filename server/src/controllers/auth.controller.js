const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { HttpError } = require('../utils/helpers');

const sign = (user) => jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.register = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (name.length < 2) throw new HttpError(400, 'Please enter your name');
  if (!EMAIL.test(email)) throw new HttpError(400, 'Please enter a valid email');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (await User.findOne({ email })) throw new HttpError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
};

exports.login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Incorrect email or password');
  }
  res.json({ token: sign(user), user: publicUser(user) });
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(401, 'Account not found');
  res.json({ user: publicUser(user) });
};