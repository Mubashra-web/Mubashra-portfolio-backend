const path = require('path');
const fs = require('fs');
const Profile = require('../models/Profile');
const asyncHandler = require('../utils/asyncHandler');
const { UPLOAD_DIR, deleteFromS3 } = require('../middleware/upload');

async function findProfileDoc() {
  return Profile.findOne();
}

function removeFileIfLocal(relativePath) {
  if (!relativePath || /^https?:\/\//i.test(relativePath)) return;
  const filename = path.basename(relativePath);
  const fullPath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(fullPath)) fs.unlink(fullPath, () => {});
}

const getProfile = asyncHandler(async (_req, res) => {
  const profile = await findProfileDoc();
  res.json({ success: true, data: profile || {} });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'name', 'title', 'bio', 'email', 'phone', 'location',
    'github', 'linkedin', 'twitter', 'website', 'resumeUrl',
  ];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const profile = await Profile.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  res.json({ success: true, data: profile, message: 'Profile saved.' });
});

const uploadPicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "picture".' });
  }
  let profile = await findProfileDoc();
  if (profile && profile.profilePicture) removeFileIfLocal(profile.profilePicture);

  const relativePath = `uploads/${req.file.filename}`;
  profile = await Profile.findOneAndUpdate(
    {},
    { profilePicture: relativePath },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: profile, message: 'Profile picture updated.' });
});

const deletePicture = asyncHandler(async (_req, res) => {
  const profile = await findProfileDoc();
  if (!profile || !profile.profilePicture) {
    return res.json({ success: true, data: profile || {}, message: 'No profile picture to remove.' });
  }
  removeFileIfLocal(profile.profilePicture);
  profile.profilePicture = '';
  await profile.save();
  res.json({ success: true, data: profile, message: 'Profile picture removed.' });
});

// POST /api/profile/resume  (protected, multipart/form-data field "resume")
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "resume".' });
  }
  let profile = await findProfileDoc();
  if (profile && profile.resumeUrl) {
    await deleteFromS3(profile.resumeUrl);
  }

  profile = await Profile.findOneAndUpdate(
    {},
    { resumeUrl: req.file.location },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, data: profile, message: 'Résumé updated.' });
});

// DELETE /api/profile/resume  (protected)
const deleteResume = asyncHandler(async (_req, res) => {
  const profile = await findProfileDoc();
  if (!profile || !profile.resumeUrl) {
    return res.json({ success: true, data: profile || {}, message: 'No résumé to remove.' });
  }
  await deleteFromS3(profile.resumeUrl);
  profile.resumeUrl = '';
  await profile.save();
  res.json({ success: true, data: profile, message: 'Résumé removed.' });
});

module.exports = { getProfile, updateProfile, uploadPicture, deletePicture, uploadResume, deleteResume };