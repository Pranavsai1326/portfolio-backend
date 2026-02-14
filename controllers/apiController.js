const Project = require('../models/Project');
const Contact = require('../models/Contact');
const Section = require('../models/Section');
const About = require('../models/About');
const Certification = require('../models/Certification');
const Skill = require('../models/Skill');
const Category = require('../models/Category');
const Content = require('../models/Content');

// @desc    Get all Certifications
// @route   GET /api/certifications
const getCertifications = async (req, res) => {
    try {
        const certifications = await Certification.find().sort({ createdAt: -1 });
        res.json(certifications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all Projects
// @route   GET /api/projects
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('category').sort({ displayOrder: 1, createdAt: -1 });
        res.json(projects);
    } catch (error) {
        console.error('API getProjects error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit Contact Form
// @route   POST /api/contact
const submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Basic Sanitization (trim)
        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim()
        });

        res.status(201).json({ message: 'Message sent successfully', contact });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get All Sections Visibility
// @route   GET /api/sections
const getSections = async (req, res) => {
    try {
        const sections = await Section.find();
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get About Content
// @route   GET /api/about
const getAbout = async (req, res) => {
    try {
        const about = await About.findOne().sort({ createdAt: -1 });
        res.json(about || { content: '' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getSkills = async (req, res) => {
    try {
        const skills = await Skill.find().populate('category').sort({ name: 1 });
        res.json(skills);
    } catch (error) {
        console.error('API getSkills error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getContent = async (req, res) => {
    try {
        const type = req.query.type;
        const query = type ? { type } : {};
        const content = await Content.find(query);
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getCategories = async (req, res) => {
    try {
        const type = req.query.type;
        const query = type ? { type } : {};
        const categories = await Category.find(query).sort({ displayOrder: 1, name: 1 });
        res.json(categories);
    } catch (error) {
        console.error('API getCategories error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getProjects,
    submitContact,
    getSections,
    getAbout,
    getCertifications,
    getSkills,
    getContent,
    getCategories
};
