const express = require('express');
const router = express.Router();
const { getProjects, submitContact, getSections, getAbout, getCertifications, getSkills, getContent, getCategories } = require('../controllers/apiController');

router.get('/projects', getProjects);
router.get('/certifications', getCertifications);
router.get('/skills', getSkills);
router.get('/content', getContent); // use ?type=accomplishment
router.get('/categories', getCategories);
router.post('/contact', submitContact);
router.get('/sections', getSections);
router.get('/about', getAbout);

module.exports = router;
