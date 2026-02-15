const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const Skill = require('./models/Skill');

dotenv.config();

const skillsData = [
    {
        category: 'Programming Languages',
        skills: ['C', 'Java', 'Python (working knowledge)']
    },
    {
        category: 'Web Technologies',
        skills: ['HTML', 'CSS']
    },
    {
        category: 'Data Base',
        skills: ['MySQL', 'MongoDB']
    },
    {
        category: 'Tools & Platforms',
        skills: ['MS Office', 'Visual Studio Code', 'Trailhead Platform']
    },
    {
        category: 'Operating Systems',
        skills: ['Windows', 'Android']
    },
    {
        category: 'Salesforce Development &Administration',
        skills: ['Salesforce Development', 'Automation Tools', 'Platform Configuration', 'Service Cloud', 'Data Management']
    }
];

const updateSkills = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        for (const group of skillsData) {
            // 1. Find or Create Category
            let category = await Category.findOne({ name: group.category, type: 'skill' });

            if (!category) {
                category = new Category({
                    name: group.category,
                    type: 'skill',
                    displayOrder: 0
                });
                await category.save();
                console.log(`Created Category: ${group.category}`);
            } else {
                console.log(`Found Category: ${group.category}`);
            }

            // 2. Add or Update Skills (Upsert)
            // This handles the unique name constraint by updating the category if the skill already exists.
            for (const skillName of group.skills) {
                await Skill.findOneAndUpdate(
                    { name: skillName },
                    { category: category._id },
                    { upsert: true, new: true, runValidators: true }
                );
                console.log(`  Processed Skill: ${skillName}`);
            }
        }

        console.log('All skills updated successfully!');
        process.exit();
    } catch (error) {
        console.error('Error updating skills:', error);
        process.exit(1);
    }
};

updateSkills();
