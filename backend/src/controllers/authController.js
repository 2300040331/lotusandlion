const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query('SELECT * FROM profiles WHERE email = $1 LIMIT 1', [email]);
    const user = rows[0];

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.is_blocked) {
      res.status(403);
      throw new Error('Your account is blocked');
    }

    // Update last login
    await query('UPDATE profiles SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: ['admin', 'super-admin', 'editor'].includes(user.role),
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const { rows: existingRows } = await query('SELECT id FROM profiles WHERE email = $1 LIMIT 1', [email]);
    if (existingRows.length > 0) {
      res.status(400);
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await query(
      `INSERT INTO profiles (name, email, password, role, is_blocked)
       VALUES ($1, $2, $3, 'customer', false)
       RETURNING *`,
      [name, email, hashedPassword]
    );

    const user = rows[0];
    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: false,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
const logoutUser = async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get current user profile
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  authUser,
  logoutUser,
  getMe,
  registerUser,
  getUserProfile: async (req, res) => res.json(req.user),
};
