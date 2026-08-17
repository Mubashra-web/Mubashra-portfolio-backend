const mongoose = require('mongoose');

// There is only ever one Profile document - it represents the portfolio owner.
const ProfileSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    aboutBio: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    profilePicture: { type: String, default: '' }, // relative path e.g. "uploads/xyz.jpg"
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', ProfileSchema);