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
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, tokenOptions);

    res.json({ token });
  });
};

  exports.getUserProfile = (req, res) => {
    const userId = req.user.id; // ดึง ID ของผู้ใช้จาก Token ที่ถูก Decode แล้ว
  
    User.findById(userId, (err, results) => {
      if (err) {
        return res.status(500).send('Internal server error');
      }
  
      if (results.length === 0) {
        return res.status(404).send('User not found');
      }
  
      const user = results[0];
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        profile_image: user.profile_image,
      });
    });
  };

