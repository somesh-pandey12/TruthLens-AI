const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

exports.registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

exports.loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const sign = (id) => jwt.sign({ id }, env.jwtSecret, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: sign(user._id), user: publicUser(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password || !(await bcrypt.compare(password, user.password)))
    throw new ApiError(401, 'Invalid email or password');
  res.json({ token: sign(user._id), user: publicUser(user) });
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  res.json({ user: publicUser(user) });
};