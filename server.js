const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const connectDB = require('./config/db');
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const expressLayouts = require('express-ejs-layouts');


// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(morgan('dev'));
app.use("/api/admin", adminAuthRoutes);


// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in production
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Set View Engine
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', './layouts/main'); // Default layout
app.set('views', path.join(__dirname, 'views'));

// Static Folder for Admin Assets
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// ✅ Health Check Route (for UptimeRobot)
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
