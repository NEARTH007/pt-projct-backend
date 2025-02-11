const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
require('dotenv').config();

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
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      tokenOptions
    );
    

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
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      profile_image: `${req.protocol}://${req.get("host")}/uploads/${user.profile_image}`,
    });
  });
};

// Update User
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { username, email, first_name, last_name, role } = req.body; // role รวมอยู่ใน body
  const profile_image = req.file ? req.file.filename : null;

  const userData = { username, email, first_name, last_name, role };
  if (profile_image) {
    userData.profile_image = profile_image;
  }

  // Debug Logs
  console.log('Incoming Data:', req.body);
  console.log('Prepared Data for Update:', userData);
  
  // ส่งข้อมูลไปยัง Model
  User.updateUser(id, userData, (err) => {
    if (err) {
      console.error('Database Update Error:', err); // Log ข้อผิดพลาด
      return res.status(500).send('Update failed. Try again later.');
    }
    res.json({ message: 'User updated successfully', updatedData: userData });
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
  User.getAllUsers((err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).send("Internal server error");
    }
    res.json(results);
  });
};

  
  