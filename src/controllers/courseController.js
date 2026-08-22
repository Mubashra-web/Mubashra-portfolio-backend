const Course = require('../models/Course');
const crudFactory = require('./crudFactory');

const allowedFields = [
  'courseName', 'institution', 'description', 'certificateUrl', 'order',
];

module.exports = crudFactory(Course, allowedFields, { label: 'Course' });
