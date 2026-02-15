const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { securityRateLimiter, verifyMasterPassword, ensureRestrictedUnlocked } = require('../middleware/securityMiddleware');

const {
    getLogin,
    getDashboard,
    getProjects,
    addProject,
    deleteProject,
    getContacts,
    markContactRead,
    getSettings,
    updateAccount,
    getCertifications,
    addCertification,
    deleteCertification,
    getSkills,
    addSkill,
    deleteSkill,
    getContentPage,
    addContent,
    deleteContent,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    updateProject,
    updateCertification,
    updateSkill,
    updateContent,
    setupMasterPassword,
    verifyMasterPasswordAction,
    handleFactoryReset,
    updateMasterPassword,
    updateSecurityEmail,
    lockRestrictedAccess,
    extendRestrictedSession,
    getSpotlight,
    getAccomplishments,
    getStrengths,
    clearDashboardData,
    handleBulkSectionDelete,
    getContact,
    bulkContactAction,
    toggleContactStatus,
    deleteContact,
    updateSiteConfig,
    initiateMasterPasswordRecovery,
    verifyMasterPasswordRecovery
} = require('../controllers/adminController');

router.get('/login', getLogin);
router.get('/dashboard', protect, adminOnly, getDashboard);

// Projects
router.get('/projects', protect, adminOnly, getProjects);
router.post('/projects', protect, adminOnly, addProject);
router.post('/projects/update/:id', protect, adminOnly, updateProject);
router.post('/projects/delete/:id', protect, adminOnly, deleteProject);

// Contacts
router.get('/contacts', protect, adminOnly, getContacts);
router.get('/contacts/:id', protect, adminOnly, getContact);
router.post('/contacts/bulk', protect, adminOnly, bulkContactAction);
router.put('/contacts/:id/toggle', protect, adminOnly, toggleContactStatus);
router.post('/contacts/read/:id', protect, adminOnly, markContactRead);
router.post('/contacts/delete/:id', protect, adminOnly, deleteContact);

// Certifications
router.get('/certifications', protect, adminOnly, getCertifications);
router.post('/certifications', protect, adminOnly, upload.single('image'), addCertification);
router.post('/certifications/update/:id', protect, adminOnly, upload.single('image'), updateCertification);
router.post('/certifications/delete/:id', protect, adminOnly, deleteCertification);

// Skills
router.get('/skills', protect, adminOnly, getSkills);
router.post('/skills', protect, adminOnly, addSkill);
router.post('/skills/update/:id', protect, adminOnly, updateSkill);
router.post('/skills/delete/:id', protect, adminOnly, deleteSkill);

// Content (Accomplishments/Strengths)
router.get('/accomplishments', protect, adminOnly, getAccomplishments);
router.get('/strengths', protect, adminOnly, getStrengths);
router.get('/content', protect, adminOnly, getContentPage);
router.post('/content', protect, adminOnly, addContent);
router.post('/content/update/:id', protect, adminOnly, updateContent);
router.post('/content/delete/:id', protect, adminOnly, deleteContent);

// Categories
router.get('/categories', protect, adminOnly, getCategories);
router.post('/categories', protect, adminOnly, addCategory);
router.post('/categories/update/:id', protect, adminOnly, updateCategory);
router.post('/categories/delete/:id', protect, adminOnly, deleteCategory);

// Settings
router.get('/spotlight', protect, adminOnly, getSpotlight);
router.get('/settings', protect, adminOnly, getSettings);
router.post('/settings/account', protect, adminOnly, updateAccount);
router.post('/settings/config', protect, adminOnly, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'favicon', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), updateSiteConfig);

// Security Actions
router.post('/security/setup', protect, adminOnly, securityRateLimiter, setupMasterPassword);
router.post('/security/verify', protect, adminOnly, securityRateLimiter, verifyMasterPassword, verifyMasterPasswordAction);
router.post('/security/lock', protect, adminOnly, lockRestrictedAccess);
router.post('/security/extend', protect, adminOnly, ensureRestrictedUnlocked, extendRestrictedSession);
router.post('/security/factory-reset', protect, adminOnly, securityRateLimiter, ensureRestrictedUnlocked, verifyMasterPassword, handleFactoryReset);
router.post('/security/update', protect, adminOnly, securityRateLimiter, updateMasterPassword);
router.post('/security/email', protect, adminOnly, securityRateLimiter, ensureRestrictedUnlocked, verifyMasterPassword, updateSecurityEmail);
router.post('/security/clear-dashboard', protect, adminOnly, ensureRestrictedUnlocked, clearDashboardData);
router.post('/security/bulk-delete', protect, adminOnly, securityRateLimiter, ensureRestrictedUnlocked, verifyMasterPassword, handleBulkSectionDelete);
router.post('/security/recovery/initiate', protect, adminOnly, securityRateLimiter, initiateMasterPasswordRecovery);
router.post('/security/recovery/verify', protect, adminOnly, securityRateLimiter, verifyMasterPasswordRecovery);

// Redirect /admin to /admin/default
router.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});

module.exports = router;
