const Project = require('../models/Project');
const Contact = require('../models/Contact');
const Section = require('../models/Section');
const About = require('../models/About');
const User = require('../models/User');
const Certification = require('../models/Certification');
const Security = require('../models/Security');
const bcrypt = require('bcrypt');
const buildFileUrl = require('../utils/buildFileUrl');

// @desc    Render Login Page
// @route   GET /admin/login
const getLogin = (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session.user) {
        return res.redirect('/admin/dashboard');
    }
    res.render('login', { layout: 'layouts/main', error: null });
};

// @desc    Render Dashboard
// @route   GET /admin/dashboard
const getDashboard = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const Skill = require('../models/Skill');
        const About = require('../models/About');

        const securitySettings = await Security.findOne();


        // Parallel data fetching
        const Content = require('../models/Content');

        const messagesLimit = securitySettings?.messagesClearedAt || new Date(0);

        const [
            projectCount,
            skillCount,
            certCount,
            contactCount,
            categoryCount,
            contentCount,
            projects,
            certifications,
            contacts,
            messageStats,
            profile,
            contentGrowth
        ] = await Promise.all([
            Project.countDocuments(),
            Skill.countDocuments(),
            Certification.countDocuments(),
            Contact.countDocuments(),
            Category.countDocuments(),
            Content.countDocuments(),
            Project.find().sort({ createdAt: -1 }).limit(20).populate('category'),
            Certification.find().sort({ createdAt: -1 }).limit(20),
            Contact.find().sort({ createdAt: -1 }).limit(20),
            Contact.aggregate([
                { $match: { createdAt: { $gt: messagesLimit } } },
                {
                    $group: {
                        _id: null,
                        read: { $sum: { $cond: [{ $eq: ["$isRead", true] }, 1, 0] } },
                        unread: { $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] } },
                        archived: { $sum: { $cond: [{ $eq: ["$isArchived", true] }, 1, 0] } }
                    }
                }
            ]),
            About.findOne(),
            // Aggregation for Content Growth (Last 6 Months)
            Project.aggregate([
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } },
                { $limit: 6 }
            ])
        ]);

        // Process Activity Feed (Timeline)
        const timelineLimit = securitySettings?.timelineClearedAt || new Date(0);
        const activityFeed = [];

        projects.filter(p => p.createdAt > timelineLimit).forEach(p => activityFeed.push({
            type: 'project',
            icon: 'fas fa-project-diagram',
            color: 'primary',
            message: `New Project: <strong>${p.title}</strong>`,
            secondary: p.category ? p.category.name : 'Uncategorized',
            time: p.createdAt
        }));

        certifications.filter(c => c.createdAt > timelineLimit).forEach(c => activityFeed.push({
            type: 'certification',
            icon: 'fas fa-certificate',
            color: 'warning',
            message: `New Certification: <strong>${c.title}</strong>`,
            secondary: c.issuer,
            time: c.createdAt
        }));

        contacts.filter(c => c.createdAt > timelineLimit).forEach(c => activityFeed.push({
            type: 'message',
            icon: 'fas fa-envelope',
            color: 'info',
            message: `Message from <strong>${c.name}</strong>`,
            secondary: c.subject,
            time: c.createdAt
        }));

        // Sort by time descending and take top 10
        activityFeed.sort((a, b) => new Date(b.time) - new Date(a.time));
        const recentActivity = activityFeed.slice(0, 10);

        // Recent Additions (Projects + Certifications only)
        const additionsLimit = securitySettings?.additionsClearedAt || new Date(0);
        const recentAdditions = [...projects, ...certifications]
            .filter(item => item.createdAt > additionsLimit)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(item => ({
                title: item.title,
                type: item.issuer ? 'Certification' : 'Project',
                date: item.createdAt,
                image: item.imageUrl || null
            }));

        // Recent Messages (Variable messagesLimit is already defined above)
        const recentMessages = contacts
            .filter(c => c.createdAt > messagesLimit)
            .slice(0, 5);

        // Prepare Profile Data structure
        const profileData = {
            name: profile?.name || 'Admin',
            image: profile?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'Admin')}&background=random&color=fff`,
            bio: profile?.content || 'Welcome to your professional dashboard.'
        };

        const statsData = {
            projects: projectCount,
            skills: skillCount,
            certifications: certCount,
            contacts: contactCount,
            categories: categoryCount,
            messages: contactCount,
            content: contentCount
        };

        // Calculate Login Statistics with error handling
        let loginStats = {
            totalLogins: 0,
            recentLogins: 0,
            lastLogin: null,
            failedAttempts: 0,
            recentLoginHistory: []
        };

        try {
            const userId = req.session.user?.id || req.session.user?._id;
            if (userId) {
                const currentUser = await User.findById(userId);
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

                if (currentUser) {
                    const loginsLimit = securitySettings?.loginsClearedAt || new Date(0);
                    const filteredHistory = currentUser.loginHistory?.filter(log => log.timestamp > loginsLimit) || [];

                    loginStats = {
                        totalLogins: currentUser.loginHistory?.length || 0,
                        recentLogins: currentUser.loginHistory?.filter(log => log.timestamp > sevenDaysAgo && log.success).length || 0,
                        lastLogin: currentUser.lastLogin || null,
                        failedAttempts: securitySettings?.failedAttempts || 0,
                        recentLoginHistory: filteredHistory.slice(-5).reverse()
                    };
                }
            }
        } catch (error) {
            console.error('Error calculating login stats:', error);
        }

        // Debug log
        console.log('Dashboard Stats:', statsData);
        console.log('Message Stats:', messageStats[0]);
        console.log('Login Stats:', loginStats);

        res.render('dashboard', {
            layout: 'layouts/admin',
            user: req.session.user,
            profile: profileData,
            stats: statsData,
            messageStats: messageStats[0] || { read: 0, unread: 0, archived: 0 },
            loginStats,
            analytics: {
                contentGrowth: contentGrowth // Array of { _id: "YYYY-MM", count: N }
            },
            recentActivity,
            recentAdditions,
            recentMessages, // Filtered messages
            path: '/dashboard',
            securityNotice: profile?.securityNotice || {
                enabled: true,
                message: 'Confidential Administrator Panel. This is a secure administrative environment where all activities may be logged for security purposes. Actions performed here directly affect live content and the portfolio system. Restricted access only — proceed with caution.',
                timerDuration: 5,
                blurEffect: true
            }
        });
    } catch (error) {
        console.error(error);
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Render Projects Page
// @route   GET /admin/projects
const getProjects = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const { category, page = 1, limit = 10, search } = req.query;

        const query = {};
        if (category && category !== 'all') query.category = category;
        if (search) query.title = { $regex: search, $options: 'i' };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const projects = await Project.find(query)
            .populate('category')
            .sort({ displayOrder: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Project.countDocuments(query);
        const categories = await Category.find({ type: 'project' }).sort({ name: 1 });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                projects,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                }
            });
        }

        res.render('projects', {
            layout: 'layouts/admin',
            user: req.session.user,
            projects,
            categories,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            },
            filters: { category, search },
            path: '/projects'
        });
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Server Error' });
        }
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Add New Project
// @route   POST /admin/projects
const addProject = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const { title, description, technologies, link, category, newCategoryName, displayOrder } = req.body;

        // Basic validation
        if (!title || !description) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Title and description are required' });
            }
            return res.redirect('/admin/projects?error=Missing required fields');
        }

        let categoryId = category;

        // Handle inline category addition
        if (newCategoryName && newCategoryName.trim() !== '') {
            let cat = await Category.findOne({ name: newCategoryName.trim(), type: 'project' });
            if (!cat) {
                cat = await Category.create({ name: newCategoryName.trim(), type: 'project' });
            }
            categoryId = cat._id;
        }

        const project = await Project.create({
            title,
            description,
            technologies,
            link,
            category: categoryId || null,
            displayOrder: displayOrder || 0
        });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(201).json(project);
        }
        res.redirect('/admin/projects');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not add project' });
        }
        res.redirect('/admin/projects?error=Could not add project');
    }
};

// @desc    Update Project
// @route   POST /admin/projects/update/:id
const updateProject = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const { title, description, technologies, link, category, newCategoryName, displayOrder } = req.body;

        const project = await Project.findById(req.params.id);
        if (!project) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Project not found' });
            }
            return res.redirect('/admin/projects?error=Project not found');
        }

        let categoryId = category;

        // Handle inline category addition
        if (newCategoryName && newCategoryName.trim() !== '') {
            let cat = await Category.findOne({ name: newCategoryName.trim(), type: 'project' });
            if (!cat) {
                cat = await Category.create({ name: newCategoryName.trim(), type: 'project' });
            }
            categoryId = cat._id;
        }

        project.title = title || project.title;
        project.description = description || project.description;
        project.technologies = technologies || project.technologies;
        project.link = link || project.link;
        project.category = categoryId || project.category;
        project.displayOrder = displayOrder !== undefined ? displayOrder : project.displayOrder;

        await project.save();

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(project);
        }
        res.redirect('/admin/projects?message=Project updated successfully');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not update project' });
        }
        res.redirect('/admin/projects?error=Could not update project');
    }
};

// @desc    Delete Project
// @route   POST /admin/projects/delete/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Project not found' });
            }
            return res.redirect('/admin/projects?error=Project not found');
        }
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Project deleted successfully' });
        }
        res.redirect('/admin/projects');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not delete project' });
        }
        res.redirect('/admin/projects?error=Could not delete project');
    }
};

// @desc    Get Contact Submissions (Inbox)
// @route   GET /admin/contacts
const getContacts = async (req, res) => {
    try {
        const { type, search, page = 1, limit = 20 } = req.query;

        const query = {};

        // Type Filtering
        switch (type) {
            case 'starred':
                query.isStarred = true;
                query.isArchived = false;
                break;
            case 'important':
                query.isImportant = true;
                query.isArchived = false;
                break;
            case 'archived':
                query.isArchived = true;
                break;
            case 'read':
                query.isRead = true;
                query.isArchived = false;
                break;
            case 'unread':
                query.isRead = false;
                query.isArchived = false;
                break;
            default: // 'inbox' or undefined
                query.isArchived = false;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const contacts = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Contact.countDocuments(query);

        // Count unread messages for sidebar badge
        const unreadCount = await Contact.countDocuments({ isRead: false, isArchived: false });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                contacts,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit),
                    limit: parseInt(limit)
                },
                unreadCount
            });
        }

        res.render('contacts', {
            layout: 'layouts/admin',
            user: req.session.user,
            contacts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            },
            filters: { type, search },
            unreadCount,
            path: '/contacts'
        });
    } catch (error) {
        console.error(error);
        if (req.xhr) return res.status(500).json({ message: 'Server Error' });
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Mark Contact as Read
// @route   POST /admin/contacts/read/:id
const markContactRead = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
        if (!contact) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Contact not found' });
            }
            return res.redirect('/admin/contacts');
        }
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(contact);
        }
        res.redirect('/admin/contacts');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Server Error' });
        }
        res.redirect('/admin/contacts');
    }
};

// @desc    Get Single Contact
// @route   GET /admin/contacts/:id
const getContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.redirect('/admin/contacts');
        }

        // Mark as read if not already
        if (!contact.isRead) {
            contact.isRead = true;
            await contact.save();
        }

        res.render('contact-details', {
            layout: 'layouts/admin',
            user: req.session.user,
            contact,
            path: '/contacts'
        });
    } catch (error) {
        console.error(error);
        res.redirect('/admin/contacts');
    }
};

// @desc    Delete Contact Message
// @route   POST /admin/contacts/delete/:id
const deleteContact = async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Contact deleted' });
        }
        res.redirect('/admin/contacts');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/contacts');
    }
};

// @desc    Bulk Actions for Contacts
// @route   POST /admin/contacts/bulk
const bulkContactAction = async (req, res) => {
    try {
        const { action, ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No messages selected' });
        }

        let update = {};
        switch (action) {
            case 'markRead':
                update = { isRead: true };
                break;
            case 'markUnread':
                update = { isRead: false };
                break;
            case 'star':
                update = { isStarred: true };
                break;
            case 'unstar':
                update = { isStarred: false };
                break;
            case 'archive':
                update = { isArchived: true };
                break;
            case 'restore':
                update = { isArchived: false };
                break;
            case 'delete':
                await Contact.deleteMany({ _id: { $in: ids } });
                return res.json({ message: 'Messages deleted successfully' });
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        await Contact.updateMany({ _id: { $in: ids } }, { $set: update });
        res.json({ message: 'Action completed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle Contact Status (Star/Important)
// @route   PUT /admin/contacts/:id/toggle
const toggleContactStatus = async (req, res) => {
    try {
        const { field } = req.body; // 'isStarred' or 'isImportant'

        if (!['isStarred', 'isImportant'].includes(field)) {
            return res.status(400).json({ message: 'Invalid field' });
        }

        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        contact[field] = !contact[field];
        await contact.save();

        res.json({ message: 'Status updated', [field]: contact[field] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Render Settings Page
// @route   GET /admin/settings
const getSettings = async (req, res) => {
    try {
        const About = require('../models/About');
        const Content = require('../models/Content');

        let config = await About.findOne();
        if (!config) config = {};

        const roles = await Content.find({ type: 'typing_role' });
        const security = await Security.findOne();

        res.render('settings', {
            layout: 'layouts/admin',
            user: req.session.user,
            message: req.query.message,
            error: req.query.error,
            config,
            securitySetup: !!security,
            securityEmail: security ? security.securityEmail : null,
            lockUntil: security ? security.lockUntil : null,
            path: '/settings'
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
};

// @desc    Update Site Config (Profile Image, Favicon, About)
// @route   POST /admin/settings/config
// @desc    Update Site Config (Profile Image, Favicon, About)
// @route   POST /admin/settings/config
const updateSiteConfig = async (req, res) => {
    try {
        const { content } = req.body;
        const About = require('../models/About');

        let profileImagePath;
        let faviconPath;
        let resumePath;

        if (req.files) {
            if (req.files.profileImage) {
                profileImagePath = buildFileUrl(req, req.files.profileImage[0].filename);
            }
            if (req.files.favicon) {
                faviconPath = buildFileUrl(req, req.files.favicon[0].filename);
            }
            if (req.files.resume) {
                resumePath = buildFileUrl(req, req.files.resume[0].filename);
            }
        }

        let config = await About.findOne();
        if (config) {
            if (profileImagePath) config.profileImage = profileImagePath;
            if (faviconPath) config.favicon = faviconPath;
            if (resumePath) config.resumeUrl = resumePath;
            if (content !== undefined) config.content = content;
            if (req.body.name) config.name = req.body.name;
            if (req.body.title) config.title = req.body.title;
            if (req.body.tagline) config.tagline = req.body.tagline;

            // Security Notice Settings
            if (config.securityNotice) {
                if (req.body.securityNoticeMessage) config.securityNotice.message = req.body.securityNoticeMessage;
                if (req.body.securityNoticeTimer) config.securityNotice.timerDuration = parseInt(req.body.securityNoticeTimer);

                // Handle checkboxes (if sent as 'on', true; if missing in body but we are in config update, it might mean false?)
                // Actually, for checkboxes, if unchecked, they are not sent. So we need to check if *any* security field is sent to know we are updating security settings?
                // Or better, we can assume if 'updateType' is 'security' or check for specific hidden field.
                // For now, let's assume if updateType is 'security' or similar. 
                // But the user didn't specify separate endpoints.
                // Let's check if 'securityUpdate' flag is present or just handle it based on presence.

                // A safer way for checkboxes in a shared form is checking a hidden field 'securitySettingsUpdate'
                if (req.body.securitySettingsUpdate) {
                    config.securityNotice.enabled = req.body.securityNoticeEnabled === 'on';
                    config.securityNotice.blurEffect = req.body.securityNoticeBlur === 'on';
                }
            } else {
                // Initialize if missing
                config.securityNotice = {
                    enabled: req.body.securityNoticeEnabled === 'on',
                    message: req.body.securityNoticeMessage,
                    timerDuration: parseInt(req.body.securityNoticeTimer),
                    blurEffect: req.body.securityNoticeBlur === 'on'
                };
            }

            await config.save();
        } else {
            config = await About.create({
                profileImage: profileImagePath,
                favicon: faviconPath,
                resumeUrl: resumePath,
                content,
                name: req.body.name,
                title: req.body.title,
                tagline: req.body.tagline,
                securityNotice: {
                    enabled: req.body.securityNoticeEnabled === 'on',
                    message: req.body.securityNoticeMessage || 'Confidential Administrator Panel...',
                    timerDuration: parseInt(req.body.securityNoticeTimer) || 5,
                    blurEffect: req.body.securityNoticeBlur === 'on'
                }
            });
        }


        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Site configuration updated', config });
        }

        const redirectPath = req.body.redirectPath || '/admin/settings';
        res.redirect(`${redirectPath}?message=Site configuration updated`);
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not update configuration' });
        }
        const redirectPath = req.body.redirectPath || '/admin/content';
        const tab = req.query.tab || 'about';
        res.redirect(`${redirectPath}?error=Could not update configuration&tab=${tab}`);
    }
};

// @desc    Update Account (Username/Password)
// @route   POST /admin/settings/account
const updateAccount = async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.user?._id || req.user?._id);

        if (!user) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.redirect('/admin/settings?error=User not found');
        }

        // MANDATORY: Verify Existing Password for any modification
        const isPasswordMatch = await user.matchPassword(currentPassword);
        if (!isPasswordMatch) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(401).json({ message: 'Invalid Existing Password' });
            }
            return res.redirect('/admin/settings?error=Invalid Existing Password');
        }

        // SENSITIVE CHANGE CHECK: Required Master Password
        if (username !== user.username || (newPassword && newPassword.trim() !== '')) {
            const { masterPassword } = req.body;
            if (!masterPassword) {
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(400).json({ message: 'Master Password verification required' });
                }
                return res.redirect('/admin/settings?error=Master Password verification required');
            }

            const security = await Security.findOne();
            if (!security) {
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(404).json({ message: 'Security System not initialized' });
                }
                return res.redirect('/admin/settings?error=Security System not initialized');
            }

            const isMasterMatch = await security.matchMasterPassword(masterPassword);
            if (!isMasterMatch) {
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(401).json({ message: 'Invalid Master Password' });
                }
                return res.redirect('/admin/settings?error=Invalid Master Password');
            }
        }

        // Update username if provided and different
        if (username && username !== user.username) {
            // Check if username taken
            const userExists = await User.findOne({ username });
            if (userExists && userExists._id.toString() !== user._id.toString()) {
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(400).json({ message: 'Username already taken' });
                }
                return res.redirect('/admin/settings?error=Username already taken');
            }
            user.username = username;
            if (req.session.user) req.session.user.username = username;
        }

        if (newPassword && newPassword.trim() !== '') {
            // Strength validation: min 8 chars, 1 uppercase, 1 special
            const passRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
            if (!passRegex.test(newPassword)) {
                if (req.xhr || req.headers.accept?.includes('application/json')) {
                    return res.status(400).json({ message: 'New password must be at least 8 chars with 1 uppercase and 1 special symbol' });
                }
                return res.redirect('/admin/settings?error=Weak new password policy');
            }
            user.password = newPassword;
        }

        await user.save();

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Account credentials updated successfully' });
        }
        res.redirect('/admin/settings?message=Account credentials updated successfully');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Server Error' });
        }
        res.redirect('/admin/settings?error=Server Error');
    }
};

// @desc    Render Certifications Page
// @route   GET /admin/certifications
const getCertifications = async (req, res) => {
    try {
        const certifications = await Certification.find().sort({ createdAt: -1 });

        // Format dates for display
        const formattedCertifications = certifications.map(cert => {
            const c = cert.toObject();
            if (cert.issueDate) {
                const date = new Date(cert.issueDate);
                c.formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); // "Jan 2024"
                c.isoDate = date.toISOString().split('T')[0]; // "2024-01-01" for input type="date"
            } else {
                c.formattedDate = '';
                c.isoDate = '';
            }
            return c;
        });

        res.render('certifications', {
            layout: 'layouts/admin',
            user: req.session.user,
            certifications: formattedCertifications,
            path: '/certifications'
        });
    } catch (error) {
        console.error(error);
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Add Certification
// @route   POST /admin/certifications
const addCertification = async (req, res) => {
    try {
        const { title, issuer, link, issueDate, description } = req.body;

        if (!title || !issuer || !description) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Title, issuer, and description are required' });
            }
            return res.redirect('/admin/certifications?error=Missing required fields');
        }

        if (!req.file) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Certification image is required' });
            }
            return res.redirect('/admin/certifications?error=Image is required');
        }

        const imageUrl = buildFileUrl(req, req.file.filename);

        const cert = await Certification.create({
            title,
            issuer,
            imageUrl,
            link,
            issueDate,
            description
        });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(201).json(cert);
        }
        res.redirect('/admin/certifications');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not add certification' });
        }
        res.redirect('/admin/certifications?error=Could not add certification');
    }
};

// @desc    Update Certification
// @route   POST /admin/certifications/update/:id
const updateCertification = async (req, res) => {
    try {
        const { title, issuer, link, issueDate, description } = req.body;
        const cert = await Certification.findById(req.params.id);

        if (!cert) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Certification not found' });
            }
            return res.redirect('/admin/certifications?error=Certification not found');
        }

        cert.title = title || cert.title;
        cert.issuer = issuer || cert.issuer;
        cert.link = link || cert.link;
        cert.issueDate = issueDate || cert.issueDate;
        cert.description = description || cert.description;

        if (req.file) {
            cert.imageUrl = buildFileUrl(req, req.file.filename);
        }

        await cert.save();

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(cert);
        }
        res.redirect('/admin/certifications?message=Certification updated successfully');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not update certification' });
        }
        res.redirect('/admin/certifications?error=Could not update certification');
    }
};

// @desc    Delete Certification
// @route   POST /admin/certifications/delete/:id
const deleteCertification = async (req, res) => {
    try {
        const cert = await Certification.findByIdAndDelete(req.params.id);
        if (!cert) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Certification not found' });
            }
            return res.redirect('/admin/certifications?error=Certification not found');
        }
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Certification deleted successfully' });
        }
        res.redirect('/admin/certifications');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not delete certification' });
        }
        res.redirect('/admin/certifications?error=Could not delete certification');
    }
};


// @desc    Render Skills Page
// @route   GET /admin/skills
const getSkills = async (req, res) => {
    try {
        const Skill = require('../models/Skill');
        const Category = require('../models/Category');
        const skills = await Skill.find().populate('category');
        const categories = await Category.find({ type: 'skill' }).sort({ name: 1 });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(skills);
        }

        res.render('skills', {
            layout: 'layouts/admin',
            user: req.session.user,
            skills,
            categories,
            message: req.query.message,
            error: req.query.error,
            path: '/skills'
        });
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Server Error' });
        }
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Render Accomplishments Page
// @route   GET /admin/accomplishments
const getAccomplishments = async (req, res) => {
    try {
        const Content = require('../models/Content');
        const accomplishments = await Content.find({ type: 'accomplishment' });

        res.render('accomplishments', {
            layout: 'layouts/admin',
            user: req.session.user,
            accomplishments,
            message: req.query.message,
            error: req.query.error,
            path: '/accomplishments'
        });
    } catch (error) {
        console.error(error);
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Render Strengths Page
// @route   GET /admin/strengths
const getStrengths = async (req, res) => {
    try {
        const Content = require('../models/Content');
        const strengths = await Content.find({ type: 'strength' });

        res.render('strengths', {
            layout: 'layouts/admin',
            user: req.session.user,
            strengths,
            message: req.query.message,
            error: req.query.error,
            path: '/strengths'
        });
    } catch (error) {
        console.error(error);
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Add Skill
// @route   POST /admin/skills
const addSkill = async (req, res) => {
    try {
        const Skill = require('../models/Skill');
        const Category = require('../models/Category');
        const { name, category, newCategoryName } = req.body;

        if (!name) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Skill name is required' });
            }
            return res.redirect('/admin/skills?error=Skill name is required');
        }

        let categoryId = category;

        // Handle inline category addition
        if (newCategoryName && newCategoryName.trim() !== '') {
            let cat = await Category.findOne({ name: newCategoryName.trim(), type: 'skill' });
            if (!cat) {
                cat = await Category.create({ name: newCategoryName.trim(), type: 'skill' });
            }
            categoryId = cat._id;
        }

        if (!categoryId || categoryId === 'new') {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Category is required' });
            }
            return res.redirect('/admin/skills?error=Category is required');
        }

        const skill = await Skill.create({ name, category: categoryId });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(201).json(skill);
        }
        res.redirect('/admin/skills');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not add skill' });
        }
        res.redirect('/admin/skills?error=Could not add skill');
    }
};

// @desc    Update Skill
// @route   POST /admin/skills/update/:id
const updateSkill = async (req, res) => {
    try {
        const Skill = require('../models/Skill');
        const Category = require('../models/Category');
        const { name, category, newCategoryName } = req.body;

        const skill = await Skill.findById(req.params.id);
        if (!skill) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Skill not found' });
            }
            return res.redirect('/admin/skills?error=Skill not found');
        }

        let categoryId = category;

        // Handle inline category addition
        if (newCategoryName && newCategoryName.trim() !== '') {
            let cat = await Category.findOne({ name: newCategoryName.trim(), type: 'skill' });
            if (!cat) {
                cat = await Category.create({ name: newCategoryName.trim(), type: 'skill' });
            }
            categoryId = cat._id;
        }

        skill.name = name || skill.name;
        if (categoryId) skill.category = categoryId;

        await skill.save();

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(skill);
        }
        res.redirect('/admin/content?message=Skill updated successfully&tab=skills');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not update skill' });
        }
        res.redirect('/admin/skills?error=Could not update skill');
    }
};

// @desc    Delete Skill
// @route   POST /admin/skills/delete/:id
const deleteSkill = async (req, res) => {
    try {
        const Skill = require('../models/Skill');
        const skill = await Skill.findByIdAndDelete(req.params.id);
        if (!skill) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Skill not found' });
            }
            return res.redirect('/admin/skills?error=Skill not found');
        }
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Skill deleted successfully' });
        }
        res.redirect('/admin/skills');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not delete skill' });
        }
        res.redirect('/admin/skills?error=Could not delete skill');
    }
};

// @desc    Render Content Page (Accomplishments/Strengths)
// @route   GET /admin/content
const getContentPage = async (req, res) => {
    try {
        const Content = require('../models/Content');
        const Skill = require('../models/Skill');
        const Category = require('../models/Category');

        const accomplishments = await Content.find({ type: 'accomplishment' });
        const strengths = await Content.find({ type: 'strength' });

        // Fetch Skills and Categories
        const skills = await Skill.find().populate('category');
        const categories = await Category.find({ type: 'skill' }).sort({ name: 1 });
        const About = require('../models/About');
        const config = await About.findOne();

        res.render('accomplishments', {
            layout: 'layouts/admin',
            user: req.session.user,
            accomplishments,
            strengths,
            skills,
            categories,
            config: config || {},
            message: req.query.message,
            error: req.query.error,
            tab: req.query.tab || 'accomplishments',
            path: '/content'
        });
    } catch (error) {
        console.error(error);
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Add Content
// @route   POST /admin/content
const addContent = async (req, res) => {
    try {
        const Content = require('../models/Content');
        const { type, text } = req.body;

        if (!type || !text) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Type and text are required' });
            }
            return res.redirect('/admin/content?error=Missing required fields');
        }

        const content = await Content.create(req.body);

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(201).json(content);
        }
        res.redirect('/admin/content');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not add content' });
        }
        res.redirect('/admin/content?error=Could not add content');
    }
};

// @desc    Update Content
// @route   POST /admin/content/update/:id
const updateContent = async (req, res) => {
    try {
        const Content = require('../models/Content');
        const { text, type } = req.body; // type needed for redirect tab

        const content = await Content.findByIdAndUpdate(req.params.id, { text }, { new: true });

        if (!content) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Content not found' });
            }
            return res.redirect(`/admin/content?error=Content not found&tab=${type}`);
        }

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(content);
        }

        // Determine tab based on content type if not passed
        let tab = 'accomplishments';
        if (content.type === 'strength') tab = 'strengths';

        // Typing roles are now in settings, redirect there
        if (content.type === 'typing_role') {
            return res.redirect(`/admin/settings?message=Content updated&tab=roles`);
        }

        if (type) {
            if (type === 'strength') tab = 'strengths';
            if (type === 'typing_role') {
                return res.redirect(`/admin/settings?message=Content updated&tab=roles`);
            }
        }

        res.redirect(`/admin/content?message=Content updated&tab=${tab}`);
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not update content' });
        }
        res.redirect('/admin/content?error=Could not update content');
    }
};

// @desc    Delete Content
// @route   POST /admin/content/delete/:id
const deleteContent = async (req, res) => {
    try {
        const Content = require('../models/Content');
        const content = await Content.findByIdAndDelete(req.params.id);
        if (!content) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(404).json({ message: 'Content not found' });
            }
            return res.redirect('/admin/content?error=Content not found');
        }
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Content deleted successfully' });
        }
        res.redirect('/admin/content');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not delete content' });
        }
        res.redirect('/admin/content?error=Could not delete content');
    }
};


// --- Category Management ---

// @desc    Render Categories Page
// @route   GET /admin/categories
const getCategories = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const categories = await Category.find().sort({ type: 1, name: 1 });

        res.render('categories', {
            layout: 'layouts/admin',
            user: req.session.user,
            categories,
            path: '/categories'
        });
    } catch (error) {
        console.error(error);
        res.render('error', { layout: 'layouts/main' });
    }
};

// @desc    Add New Category
// @route   POST /admin/categories
const addCategory = async (req, res) => {
    try {
        const { name, type, displayOrder } = req.body;
        const Category = require('../models/Category');

        if (!name || !type) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Name and type are required' });
            }
            return res.redirect('/admin/categories?error=Name and type are required');
        }

        const category = await Category.create({
            name,
            type,
            displayOrder: displayOrder || 0
        });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(201).json(category);
        }
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            if (error.code === 11000) {
                return res.status(400).json({ message: 'Category name already exists for this type' });
            }
            return res.status(500).json({ message: 'Could not add category' });
        }
        res.redirect('/admin/categories?error=Could not add category');
    }
};

// @desc    Update Category
// @route   POST /admin/categories/update/:id
const updateCategory = async (req, res) => {
    try {
        const { name, type, displayOrder } = req.body;
        const Category = require('../models/Category');

        const category = await Category.findByIdAndUpdate(req.params.id, {
            name,
            type,
            displayOrder: displayOrder || 0
        }, { new: true });

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json(category);
        }
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not update category' });
        }
        res.redirect('/admin/categories?error=Could not update category');
    }
};

// @desc    Delete Category
// @route   POST /admin/categories/delete/:id
const deleteCategory = async (req, res) => {
    try {
        const Category = require('../models/Category');
        const Skill = require('../models/Skill');
        const Project = require('../models/Project');

        const skillCount = await Skill.countDocuments({ category: req.params.id });
        const projectCount = await Project.countDocuments({ category: req.params.id });

        if (skillCount > 0 || projectCount > 0) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(400).json({ message: 'Cannot delete category while it is in use by skills or projects' });
            }
            return res.redirect('/admin/categories?error=Category is in use');
        }

        await Category.findByIdAndDelete(req.params.id);

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ message: 'Category deleted' });
        }
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ message: 'Could not delete category' });
        }
        res.redirect('/admin/categories?error=Could not delete category');
    }
};

// @desc    Setup Master Password (One-time)
// @route   POST /admin/security/setup
const setupMasterPassword = async (req, res) => {
    try {
        const { masterPassword } = req.body;
        if (!masterPassword) return res.status(400).json({ message: 'Master Password is required' });

        const existingSecurity = await Security.findOne();
        if (existingSecurity) {
            return res.status(400).json({ message: 'Master Password already setup' });
        }

        await Security.create({ masterPassword });
        res.json({ message: 'Master Password setup successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error during setup' });
    }
};

// @desc    Verify Master Password for UI Unlock
// @route   POST /admin/security/verify
const verifyMasterPasswordAction = async (req, res) => {
    try {
        // middleware handles verification
        res.json({ success: true, message: 'Verified' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Portfolio Factory Reset
// @route   POST /admin/security/factory-reset
const handleFactoryReset = async (req, res) => {
    try {
        const { confirmationPhrase } = req.body;
        if (confirmationPhrase !== 'RESET MY PORTFOLIO') {
            return res.status(400).json({ message: 'Invalid confirmation phrase' });
        }

        // Wipe data
        await Project.deleteMany({});
        await Contact.deleteMany({});
        await Certification.deleteMany({});
        const Skill = require('../models/Skill');
        const Category = require('../models/Category');
        const Content = require('../models/Content');
        await Skill.deleteMany({});
        await Category.deleteMany({});
        await Content.deleteMany({});

        // Log action
        const security = await Security.findOne();
        if (security) {
            security.restrictedAccessLogs.push({
                action: 'FACTORY_RESET',
                performedBy: req.session.user?._id || req.user?._id,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                details: 'Full system data wipe performed.'
            });
            await security.save();
        }

        res.json({ message: 'System reset successful. All data cleared.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error during factory reset' });
    }
};

// @desc    Update Master Password
// @route   POST /admin/security/update
const updateMasterPassword = async (req, res) => {
    try {
        const { currentMasterPassword, newMasterPassword } = req.body;
        const security = await Security.findOne();

        if (!security) return res.status(404).json({ message: 'Security config not found' });

        const isMatch = await security.matchMasterPassword(currentMasterPassword);
        if (!isMatch) return res.status(401).json({ message: 'Invalid current Master Password' });

        security.masterPassword = newMasterPassword;
        await security.save();

        res.json({ message: 'Master Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error during password update' });
    }
};

// @desc    Update Security Email
// @route   POST /admin/security/email
const updateSecurityEmail = async (req, res) => {
    try {
        const { securityEmail } = req.body;
        const security = await Security.findOne();

        if (!security) return res.status(404).json({ message: 'Security config not found' });

        security.securityEmail = securityEmail;
        await security.save();

        res.json({ message: 'Security notification email updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error during email update' });
    }
};

// @desc    Render Spotlight Page (formerly Profile Studio)
// @route   GET /admin/spotlight
const getSpotlight = async (req, res) => {
    try {
        const About = require('../models/About');
        const Content = require('../models/Content');

        const config = await About.findOne();
        const roles = await Content.find({ type: 'typing_role' }).sort({ createdAt: -1 });

        res.render('spotlight', {
            layout: 'layouts/admin',
            user: req.session.user,
            config: config || {},
            roles: roles || [],
            path: '/spotlight'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', {
            layout: 'layouts/admin',
            message: 'Error loading Spotlight',
            error
        });
    }
};

// @desc    Explicitly lock Restricted Access (clear session)
// @route   POST /admin/security/lock
const lockRestrictedAccess = async (req, res) => {
    try {
        if (req.session) {
            req.session.restrictedUnlocked = false;
            req.session.restrictedExpiresAt = null;
            req.session.extensionCount = 0;
        }

        // Log the logout event
        const security = await Security.findOne();
        if (security) {
            security.restrictedAccessLogs.push({
                action: 'LOGOUT',
                performedBy: req.session.user?._id || req.user?._id,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                details: 'Manual Restricted Access lockout performed.'
            });
            await security.save();
        }

        res.json({ message: 'Restricted Access locked successfully', locked: true });
    } catch (error) {
        console.error('Lock Error:', error);
        res.status(500).json({ message: 'Error locking section' });
    }
};

// @desc    Extend Restricted Access Session
// @route   POST /admin/security/extend
const extendRestrictedSession = async (req, res) => {
    try {
        // Strict Security Policy Enforcement: Session extensions are disabled
        return res.status(403).json({
            success: false,
            message: 'Strict Security Policy: Session extensions/resets are disabled. Your session will automatically lock after 180 seconds.',
            remaining: req.session.restrictedExpiresAt ? Math.max(0, Math.round((req.session.restrictedExpiresAt - Date.now()) / 1000)) : 0
        });
    } catch (error) {
        console.error('Extension Error:', error);
        res.status(500).json({ message: 'Error processing restricted session' });
    }
};

// @desc    Clear Dashboard Data (Non-destructive)
// @route   POST /admin/security/clear-dashboard
const clearDashboardData = async (req, res) => {
    try {
        const { type } = req.body;
        const security = await Security.findOne();
        if (!security) return res.status(404).json({ message: 'Security settings not found' });

        const now = new Date();
        let actionLabel = '';

        if (type === 'messages') {
            security.messagesClearedAt = now;
            actionLabel = 'Cleared Recent Messages';
        } else if (type === 'timeline') {
            security.timelineClearedAt = now;
            actionLabel = 'Cleared Activity Timeline';
        } else if (type === 'additions') {
            security.additionsClearedAt = now;
            actionLabel = 'Cleared Recent Additions';
        } else if (type === 'logins') {
            security.loginsClearedAt = now;
            actionLabel = 'Cleared Recent Login Activity';
        } else {
            return res.status(400).json({ message: 'Invalid clear type' });
        }

        security.restrictedAccessLogs.push({
            action: actionLabel,
            performedBy: req.session.user.id,
            timestamp: now,
            details: `Non-destructive reset of ${type} view`
        });

        await security.save();
        res.json({ message: `${actionLabel} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Bulk Section Delete (Destructive)
// @route   POST /admin/security/bulk-delete
const handleBulkSectionDelete = async (req, res) => {
    try {
        const { section, confirmationPhrase } = req.body;
        const expectedPhrase = `RESET MY ${section.toUpperCase()}`;

        if (confirmationPhrase !== expectedPhrase) {
            return res.status(400).json({ message: 'Invalid confirmation phrase' });
        }

        const Skill = require('../models/Skill');
        const Category = require('../models/Category');
        const Content = require('../models/Content');

        let model;
        let sectionName = '';

        switch (section.toLowerCase()) {
            case 'projects': model = Project; sectionName = 'Projects'; break;
            case 'skills': model = Skill; sectionName = 'Skills'; break;
            case 'certifications': model = Certification; sectionName = 'Certifications'; break;
            case 'messages': model = Contact; sectionName = 'Messages'; break;
            case 'categories': model = Category; sectionName = 'Categories'; break;
            case 'content': model = Content; sectionName = 'Content'; break;
            default: return res.status(400).json({ message: 'Invalid section' });
        }

        const deleteResult = await model.deleteMany({});

        const security = await Security.findOne();
        security.restrictedAccessLogs.push({
            action: `Bulk Delete: ${sectionName}`,
            performedBy: req.session.user.id,
            timestamp: new Date(),
            details: `Permanently deleted ${deleteResult.deletedCount} items from ${sectionName}`
        });
        await security.save();

        res.json({ message: `Successfully deleted all ${sectionName}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Initiate Master Password Recovery
// @route   POST /admin/security/recovery/initiate
const initiateMasterPasswordRecovery = async (req, res) => {
    try {
        const Security = require('../models/Security');
        const security = await Security.findOne();

        if (!security || !security.securityEmail) {
            return res.status(400).json({ error: 'Security email not configured. Cannot perform recovery.' });
        }

        // Check for cooldown
        if (security.resetOTPLockUntil && security.resetOTPLockUntil > Date.now()) {
            const waitTime = Math.ceil((security.resetOTPLockUntil - Date.now()) / 1000 / 60);
            return res.status(429).json({ error: `Too many failed attempts. Try again in ${waitTime} minutes.` });
        }

        // Generate 6-digit OTP
        const crypto = require('crypto');
        const otp = crypto.randomInt(100000, 999999).toString();

        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        // Update Security Model
        security.resetOTP = hashedOTP;
        security.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        security.resetOTPAttempts = 0;
        await security.save();

        // Send Email
        const transporter = require('../config/emailConfig');
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: security.securityEmail,
            subject: 'Your Master Password Recovery Code - Secure Admin Panel',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #4a90e2;">Master Password Recovery</h2>
                    <p>You requested to reset your Master Password. Use the following OTP code to verify your identity:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p style="color: #777; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email and check your security settings immediately.</p>
                </div>
            `
        };

        if (transporter) {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending OTP:', error);
                    return res.status(500).json({ error: 'Failed to send OTP email.' });
                }
                res.json({ message: 'OTP sent successfully to your configured email.', email: security.securityEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
            });
        } else {
            // Fallback for development/no-email setup (SHOULD BE REMOVED IN PROD)
            console.log('DEV MODE OTP:', otp);
            res.json({ message: 'OTP generated (Dev Mode: Check Console)', email: security.securityEmail });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during recovery initiation.' });
    }
};

// @desc    Verify OTP and Reset Master Password
// @route   POST /admin/security/recovery/verify
const verifyMasterPasswordRecovery = async (req, res) => {
    try {
        const { otp, newPassword, confirmPassword } = req.body;
        const Security = require('../models/Security');
        const security = await Security.findOne();

        if (!security || !security.resetOTP) {
            return res.status(400).json({ error: 'No active recovery session found.' });
        }

        // Check for cooldown (Double check)
        if (security.resetOTPLockUntil && security.resetOTPLockUntil > Date.now()) {
            return res.status(429).json({ error: 'Recovery locked due to too many failed attempts.' });
        }

        // Check Expiration
        if (security.resetOTPExpires < Date.now()) {
            security.resetOTP = undefined;
            security.resetOTPExpires = undefined;
            await security.save();
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, security.resetOTP);

        if (!isMatch) {
            security.resetOTPAttempts += 1;
            if (security.resetOTPAttempts >= 3) {
                security.resetOTPLockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
                security.resetOTP = undefined; // Clear OTP on lock
                security.resetOTPExpires = undefined;
            }
            await security.save();
            return res.status(400).json({ error: `Invalid OTP. ${3 - security.resetOTPAttempts} attempts remaining.` });
        }

        // OTP Verified - Reset Password
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }

        // Password Strength Check (Simple)
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }

        // Save New Password (middleware handles hashing)
        security.masterPassword = newPassword;
        security.resetOTP = undefined;
        security.resetOTPExpires = undefined;
        security.resetOTPAttempts = 0;
        security.resetOTPLockUntil = undefined;

        await security.save();

        res.json({ success: true, message: 'Master Password has been successfully reset.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during password reset.' });
    }
};

module.exports = {
    getLogin,
    getDashboard,
    getProjects,
    addProject,
    deleteProject,
    getContacts,
    getContact,
    markContactRead,
    getSettings,
    updateSiteConfig,
    updateAccount,
    getCertifications,
    addCertification,
    deleteCertification,
    getSkills,
    addSkill,
    deleteSkill,
    getAccomplishments,
    getStrengths,
    getContentPage,
    addContent,
    deleteContent,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteContact,
    updateProject,
    updateCertification,
    updateSkill,
    updateContent,
    bulkContactAction,
    toggleContactStatus,
    getSpotlight,
    setupMasterPassword,
    verifyMasterPasswordAction,
    handleFactoryReset,
    updateMasterPassword,
    updateSecurityEmail,
    lockRestrictedAccess,
    extendRestrictedSession,
    clearDashboardData,
    handleBulkSectionDelete,
    initiateMasterPasswordRecovery,
    verifyMasterPasswordRecovery
};
