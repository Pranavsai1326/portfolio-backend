import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

const Skills = () => {
    const [filter, setFilter] = useState('all');
    const [skills, setSkills] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch skills and categories in parallel
                const [skillsRes, catsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/skills`),
                    fetch(`${API_BASE_URL}/api/categories?type=skill`)
                ]);

                const skillsData = await skillsRes.json();
                const catsData = await catsRes.json();

                setSkills(skillsData);
                setCategories(catsData);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFilter = (categoryId) => {
        setFilter(categoryId);
    };

    return (
        <section id="skills" className="section reveal">
            <h2 className="section-title">Technical Skills</h2>

            <div className="skill-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => handleFilter('all')}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat._id}
                        className={`filter-btn ${filter === cat._id ? 'active' : ''}`}
                        onClick={() => handleFilter(cat._id)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="skills-grid">
                {loading ? <div className="glass-card">Loading Skills...</div> :
                    skills.map((skill, index) => (
                        <div
                            key={skill._id || index}
                            className={`skill-card ${filter !== 'all' && filter !== (skill.category?._id || skill.category) ? 'hide' : ''}`}
                            style={{ display: filter !== 'all' && filter !== (skill.category?._id || skill.category) ? 'none' : 'block' }}
                        >
                            {skill.name}
                        </div>
                    ))}
            </div>
        </section>
    );
};

export default Skills;
