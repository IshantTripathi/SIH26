import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import { store } from '../data/store.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = store.findById('users', decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User session invalid.' });
    }

    // Attach sanitized user without password hash
    const { password: _, ...sanitizedUser } = user;
    req.user = sanitizedUser;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}
