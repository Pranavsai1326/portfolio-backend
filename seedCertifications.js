const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Certification = require('./models/Certification');

dotenv.config();

const certifications = [
    { title: "Salesforce PD-1", img: "/assets/certificates/pd1.png", issuer: "Salesforce", imageUrl: "/assets/certificates/pd1.png" },
    { title: "Agentforce Specialist", img: "/assets/certificates/agentforce.png", issuer: "Salesforce", imageUrl: "/assets/certificates/agentforce.png" },
    { title: "NPTEL", img: "/assets/certificates/nptel.png", issuer: "NPTEL", imageUrl: "/assets/certificates/nptel.png" },
    { title: "GeeksforGeeks", img: "/assets/certificates/gfg.png", issuer: "GeeksforGeeks", imageUrl: "/assets/certificates/gfg.png" }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing certifications to avoid duplicates if re-run (optional, but safer for seeding)
        // await Certification.deleteMany({}); 

        for (const cert of certifications) {
            const exists = await Certification.findOne({ title: cert.title });
            if (!exists) {
                await Certification.create(cert);
                console.log(`Added: ${cert.title}`);
            } else {
                console.log(`Skipped (Exists): ${cert.title}`);
            }
        }

        console.log('Seeding Complete');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
