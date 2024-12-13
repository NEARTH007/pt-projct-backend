const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

require('dotenv').config();

const app = express();

// Middleware for CORS
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

// Middleware for parsing JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads folder
app.use('/uploads', express.static('uploads'));

// Set up API routes

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
