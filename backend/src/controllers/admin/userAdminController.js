const { query } = require('../../config/database');

const mapUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    _id: u.id,
    isBlocked: Boolean(u.is_blocked),
    isAdmin: ['admin', 'super-admin'].includes(u.role),
  };
};

const getAdminUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${pIdx} OR email ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }
    if (role) {
      conditions.push(`role = $${pIdx++}`);
      params.push(role);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM profiles ${whereClause}`, params);
    const count = Number(countRes.rows[0]?.count || 0);

    params.push(limitNum);
    const limitParam = `$${pIdx++}`;
    params.push(offset);
    const offsetParam = `$${pIdx++}`;

    const sql = `
      SELECT id, name, email, role, is_blocked, last_login, created_at
      FROM profiles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const { rows } = await query(sql, params);

    res.json({
      users: rows.map(mapUser),
      page: pageNum,
      pages: Math.ceil(count / limitNum),
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminUserById = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, role, is_blocked, last_login, created_at FROM profiles WHERE id = $1 LIMIT 1',
      [req.params.id]
    );

    if (!rows.length) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json(mapUser(rows[0]));
  } catch (error) {
    next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

const updateAdminUser = async (req, res, next) => {
  try {
    const { isBlocked, is_blocked, role } = req.body;
    const blockValue = isBlocked !== undefined ? isBlocked : is_blocked;

    const updateFields = [];
    const params = [];
    let pIdx = 1;

    if (blockValue !== undefined) {
      updateFields.push(`is_blocked = $${pIdx++}`);
      params.push(Boolean(blockValue));
    }
    if (role !== undefined) {
      updateFields.push(`role = $${pIdx++}`);
      params.push(role);
    }

    if (!updateFields.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(req.params.id);
    const sql = `UPDATE profiles SET ${updateFields.join(', ')} WHERE id = $${pIdx} RETURNING *`;
    const { rows } = await query(sql, params);

    if (!rows.length) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({ message: 'User updated', user: mapUser(rows[0]) });
  } catch (error) {
    next(error);
  }
};

const deleteAdminUser = async (req, res, next) => {
  try {
    if (req.user.id === req.params.id) {
      res.status(400);
      throw new Error('Cannot delete your own account');
    }

    await query('DELETE FROM profiles WHERE id = $1', [req.params.id]);
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminUsers,
  getAdminUserById,
  getUserOrders,
  updateAdminUser,
  deleteAdminUser,
};
