const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = {
  sendResetEmail: async (email, resetToken) => {
    try {
      const resetUrl = `http://localhost:4200/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        text: `You requested a password reset. Click the link below to reset your password: \n\n ${resetUrl} \n\nThis link is valid for 15 minutes.`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent:", info.response);
      return info;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw new Error("Failed to send reset email");
    }
  }
};
