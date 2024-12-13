const jwt = require('jsonwebtoken');
require('dotenv').config();

// Token Verification Middleware
exports.verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(403).json({ error: 'Access denied. No token provided.' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!token) return res.status(403).json({ error: 'Invalid or missing token.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Authorization Middleware
exports.authorize = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ error: 'Invalid or missing token.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = decoded;
    next();
  });
};


// File Upload Error Handler
exports.uploadErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size is too large.' });
    }
    if (err.code === 'LIMIT_FILE_TYPES') {
      return res.status(400).json({ error: 'Invalid file type.' });
    }
    return res.status(500).json({ error: 'Unexpected error during file upload.' });
  }
  next();
};
