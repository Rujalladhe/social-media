const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const validateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    logger.warn('acess atempt without valid token');
    return res.status(401).json({
      success: false,
      message: ' authencation required',
    });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('invalid token', err);
      return res.status(401).json({
        success: false,
        message: 'invalid token',
      });
    }
    req.user = user;
    next();
  });
};
module.exports = { validateToken };
