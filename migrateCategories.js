const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Skill = require('./models/Skill');
const Project = require('./models/Project');
const Category = require('./models/Category');

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Migrate Skills Categories
        console.log('Migrating Skill categories...');
        const skillsRaw = await Skill.collection.find().toArray();
        for (const skill of skillsRaw) {
            // If category is already an ObjectId string (24 chars hex), skip
            if (typeof skill.category !== 'string' || /^[0-9a-fA-F]{24}$/.test(skill.category)) continue;

            let category = await Category.findOne({ name: skill.category, type: 'skill' });
            if (!category) {
                category = await Category.create({ name: skill.category, type: 'skill' });
                console.log(`Created skill category: ${skill.category}`);
            }
            await Skill.collection.updateOne({ _id: skill._id }, { $set: { category: category._id } });
        }

        // 2. Migrate Project Categories
        console.log('Migrating Project categories...');
        const projectsRaw = await Project.collection.find().toArray();
        for (const project of projectsRaw) {
            if (!project.category) continue;
            if (typeof project.category !== 'string' || /^[0-9a-fA-F]{24}$/.test(project.category)) continue;

            let category = await Category.findOne({ name: project.category, type: 'project' });
            if (!category) {
                category = await Category.create({ name: project.category, type: 'project' });
                console.log(`Created project category: ${project.category}`);
            }
            await Project.collection.updateOne({ _id: project._id }, { $set: { category: category._id } });
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        if (error.errors) {
            console.error('Validation errors:', Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`));
        } else {
            console.error('Migration failed:', error);
        }
        process.exit(1);
    }
};

migrate();
