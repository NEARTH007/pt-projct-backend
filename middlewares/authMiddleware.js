const jwt = require('jsonwebtoken');
require('dotenv').config();


/**
 * Middleware ตรวจสอบ JWT Token
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(403).json({ error: 'Access denied. No token provided.' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  console.log("🔍 Received Token:", token); // Debug token ที่ได้รับ

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔑 Decoded Token:", decoded); // Debug ข้อมูลที่ถูก decode

    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    console.error("❌ Invalid Token:", err);
    return res.status(400).json({ error: 'Invalid token.' });
  }
};



/**
 * Middleware กำหนดสิทธิ์การเข้าถึง API ตาม Role
 * @param {Array} allowedRoles - รายการ Role ที่อนุญาตให้เข้าถึง
 */
exports.authorize = (allowedRoles = []) => (req, res, next) => {
  console.log("🔍 Checking Authorization - User Role:", req.user?.role);
  
  if (!req.user || !req.user.role) {
    return res.status(401).json({ error: "Unauthorized access. No role assigned." });
  }
  if (!allowedRoles.includes(req.user.role)) {
    console.log("⛔ Access Denied! User Role:", req.user.role);
    return res.status(403).json({ error: "Access Denied. Insufficient permissions." });
  }
  
  console.log("✅ Authorization Passed!");
  next();
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    console.log("🔑 User Token Info:", req.user); // Debug Role
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};




/**
 * Middleware จัดการข้อผิดพลาดของการอัปโหลดไฟล์
 */
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