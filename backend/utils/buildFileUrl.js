const buildFileUrl = (req, filename) => {
    const BASE_URL =
        process.env.BASE_URL ||
        `${req.protocol}://${req.get('host')}`;

    return `${BASE_URL}/uploads/${filename}`;
};

module.exports = buildFileUrl;
