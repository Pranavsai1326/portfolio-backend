const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Content = require('./models/Content');

dotenv.config();

const strengths = [
    "Leadership & Team Coordination",
    "Effective Technical Communication",
    "Analytical Problem-solving",
    "Adaptability to New Technologies",
    "Quick learner with strong debugging skills",
    "Critical Thinking & Decision making"
];

const updateStrengths = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Delete existing strengths
        await Content.deleteMany({ type: 'strength' });
        console.log('Cleared existing strengths');

        // 2. Add new strengths
        for (const strengthText of strengths) {
            const content = new Content({
                type: 'strength',
                text: strengthText
            });
            await content.save();
            console.log(`Added Strength: ${strengthText}`);
        }

        console.log('All strengths updated successfully!');
        process.exit();
    } catch (error) {
        console.error('Error updating strengths:', error);
        process.exit(1);
    }
};

updateStrengths();
