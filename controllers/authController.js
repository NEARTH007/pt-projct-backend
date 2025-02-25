const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
require("dotenv").config();
const crypto = require("crypto");
const emailService = require("../utils/emailService");
const { verifyToken, authorize } = require('../middlewares/authMiddleware');
const db = require('../config/db'); // ✅ Import Database Connection


// ประกาศตัวแปร loginAttempts เพื่อใช้เก็บจำนวนครั้งที่ผู้ใช้พยายามล็อกอินผิดพลาด
let loginAttempts = {}; 

// ฟังก์ชันการลงทะเบียนผู้ใช้
exports.register = async (req, res) => {
  try {
    const { email, username, password, first_name, last_name, role } = req.body;

    if (!email || !username || !password || !first_name || !last_name || !req.file) {
      return res.status(400).send('Missing required fields');
    }

    const profile_image = req.file.filename;

    User.findByEmailOrUsernameExact(email, username, async (err, results) => {
      if (err) {
        return res.status(500).send('Internal server error');
      }

      if (results.length > 0) {
        return res.status(400).send('Email or username already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      User.create(
        { email, username, password: hashedPassword, first_name, last_name, role, profile_image },
        (err) => {
          if (err) {
            return res.status(500).send('Registration failed. Try again later.');
          }

          res.status(201).json({
            message: 'User registered successfully',
            profile_image_url: `${req.protocol}://${req.get('host')}/uploads/${profile_image}`,
          });
        }
      );
    });
  } catch (error) {
    res.status(500).send('Registration failed. Try again later.');
  }
};


// ฟังก์ชันการล็อกอินผู้ใช้
exports.login = (req, res) => {
  const { emailOrUsername, password, rememberMe } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).send('Missing email/username or password');
  }

  User.findByEmailOrUsername(emailOrUsername, async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).send('Invalid login credentials');
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send('Invalid login credentials');
    }

    const tokenOptions = rememberMe ? {} : { expiresIn: '1h' };
    const tokenPayload = { id: user.id, username: user.username, role: user.role }; // ✅ ใส่ role ลงไป
    console.log("🔍 Generated Token Payload:", tokenPayload); // ✅ Debug

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, tokenOptions);

    res.json({ token });
  });
};

exports.logout = (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(400).json({ error: 'Token not provided.' });
  }

  // Optional: Add token to a blacklist
  res.status(200).json({ message: 'Logout successful' });
};



exports.getUserProfile = (req, res) => {
  const userId = req.user.id;
  User.findById(userId, (err, results) => {
    if (err) return res.status(500).send("Internal server error");
    if (results.length === 0) return res.status(404).send("User not found");

    const user = results[0];
    console.log("🔍 User Data Sent to Frontend:", user); // ✅ Debug

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role, // ✅ ต้องมี role ตรงนี้
      profile_image: `${req.protocol}://${req.get("host")}/uploads/${user.profile_image}`,
    });
  });
};



// Update User
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { username, email, first_name, last_name, role } = req.body;
  const profile_image = req.file ? req.file.filename : null;

  console.log("📩 Received Data from Frontend:", req.body);
  console.log("📸 Received Image:", profile_image);

  // ✅ เตรียมข้อมูลอัปเดต
  let userData = { username, email, first_name, last_name, role };
  if (profile_image) userData.profile_image = profile_image;

  // ✅ ลบค่าที่เป็น `undefined` หรือ `null`
  Object.keys(userData).forEach((key) => {
    if (!userData[key]) {
      delete userData[key];
    }
  });

  console.log("🔍 Updated User Data (Before SQL):", userData);

  // 🚀 **เพิ่มเงื่อนไข: ถ้าไม่มีข้อมูลให้อัปเดต ส่ง error กลับไป**
  if (Object.keys(userData).length === 0) {
    return res.status(400).json({ error: "No valid update fields provided" });
  }

  // ✅ สร้าง Query เพื่ออัปเดตข้อมูล
  const updateQuery = "UPDATE users SET ?, updated_at = NOW() WHERE id = ?";

  db.query(updateQuery, [userData, id], (err, results) => {
    if (err) {
      console.error("⚠️ Error Executing Query:", err);
      return res.status(500).send("Update failed. Try again later.");
    }
    console.log("✅ Update Success:", results);
    res.json({ message: "User updated successfully", updatedData: userData });
  });
};



exports.deleteUser = (req, res) => {
  const { id } = req.params;

  User.deleteUser(id, (err) => {
    if (err) return res.status(500).send("Deletion failed. Try again later.");
    res.json({ message: "User deleted successfully" });
  });
};



exports.getAllUsers = (req, res) => {
  console.log("🔍 User Role:", req.user.role); // Debug role ของ user

  User.getAllUsers((err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal server error");
    }
    res.json(results);
  });
};


// ฟังก์ชันเปลี่ยนรหัสผ่านโดยตรง
exports.updatePassword = async (req, res) => {
  try {
    console.log("Received ID:", req.params.id);
    console.log("Received Body:", req.body);

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    User.updatePassword(id, hashedPassword, (err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to update password" });
      }
      res.json({ message: "Password updated successfully" });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



// ฟังก์ชันขอเปลี่ยนรหัสผ่าน (ส่ง Token ไปให้ Email)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // ค้นหาผู้ใช้โดยใช้ email
    User.findByEmail(email, async (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      const user = results[0];
      const resetToken = crypto.randomBytes(32).toString("hex"); // 🔥 สร้าง Token สำหรับ Reset Password

      // 🔥 บันทึก Token ลงในฐานข้อมูล
      User.saveResetToken(user.id, resetToken, async (err) => {
        if (err) {
          console.error("🔴 Error saving reset token:", err);
          return res.status(500).json({ error: "Failed to generate reset token" });
        }

        console.log(`✅ Reset Token saved for ${user.email}: ${resetToken}`);

        // 🔥 **เรียกใช้ฟังก์ชันส่งอีเมล**
        try {
          await emailService.sendResetEmail(user.email, resetToken);
          console.log("📧 Reset email sent successfully.");
          res.json({ message: "Reset token sent to email" });
        } catch (error) {
          console.error("❌ Failed to send reset email:", error);
          res.status(500).json({ error: "Failed to send reset email" });
        }
      });
    });
  } catch (error) {
    console.error("🔴 Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// ฟังก์ชันรีเซ็ตรหัสผ่านโดยใช้ Token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log("🔍 Incoming Token:", token);  // Debug Token ที่ได้รับ
    console.log("🔍 Incoming New Password:", newPassword);

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    User.findByResetToken(token, async (err, results) => {
      console.log("📊 User Query Results:", results);
      if (err || results.length === 0) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      const user = results[0];
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      User.updatePassword(user.id, hashedPassword, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to reset password" });
        }

        User.clearResetToken(user.id, () => {
          res.json({ message: "Password reset successful" });
        });
      });
    });
  } catch (error) {
    console.error("🔴 Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

  
