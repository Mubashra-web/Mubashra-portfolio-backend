const Project = require('../models/Project');
const crudFactory = require('./crudFactory');
const { deleteFromS3 } = require('../middleware/upload');

const allowedFields = [
  'title', 'category', 'description', 'longDescription',
  'technologies', 'order', 'liveUrl', 'githubUrl', 'featured',
];

const controller = crudFactory(Project, allowedFields, { label: 'Project' });

const MAX_IMAGES = 70;

// POST /api/projects/:id/images  (protected, multipart/form-data field "images", multiple files)
controller.uploadImages = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded. Use field name "images".' });
    }

    const room = MAX_IMAGES - (project.images ? project.images.length : 0);
    if (room <= 0) {
      return res.status(400).json({ success: false, message: `Maximum of ${MAX_IMAGES} images per project.` });
    }

    const accepted = files.slice(0, room);
    const rejectedCount = files.length - accepted.length;

    const newUrls = accepted.map((f) => f.location); // multer-s3 gives the public URL as .location
    project.images = [...(project.images || []), ...newUrls];
    if (!project.imageUrl && project.images.length) project.imageUrl = project.images[0];
    await project.save();

    res.json({
      success: true,
      data: project,
      message: `${accepted.length} image(s) uploaded.${rejectedCount ? ` ${rejectedCount} skipped (${MAX_IMAGES}-image limit reached).` : ''}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/projects/:id/images/:index  (protected)
controller.deleteImage = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    const idx = Number(req.params.index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= (project.images || []).length) {
      return res.status(400).json({ success: false, message: 'Invalid image index.' });
    }
    const [removed] = project.images.splice(idx, 1);
    await deleteFromS3(removed);
    project.imageUrl = project.images[0] || '';
    await project.save();

    res.json({ success: true, data: project, message: 'Image removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = controller;