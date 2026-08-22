const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    courseName: { type: String, required: [true, 'Course name is required'], trim: true },
    institution: { type: String, required: [true, 'Institution is required'], trim: true },
    description: { type: String, default: '' },
    certificateUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CourseSchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('Course', CourseSchema);
