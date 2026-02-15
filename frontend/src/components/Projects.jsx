import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/projects`);
                if (!res.ok) {
                    throw new Error('Failed to fetch projects');
                }
                const data = await res.json();
                setProjects(data);
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError('Failed to load projects. Ensure backend is running.');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <section id="projects" className="section reveal">
            <h2 className="section-title">Projects</h2>
            <div id="projects-container" className="projects-grid">
                {loading && (
                    <div className="glass-card" style={{ textAlign: 'center' }}>
                        <i className="fas fa-spinner fa-spin"></i> Loading Projects...
                    </div>
                )}

                {error && (
                    <div className="glass-card" style={{ textAlign: 'center', color: '#ffcccc' }}>
                        {error}
                    </div>
                )}

                {!loading && !error && projects.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', gridColumn: '1/-1' }}>
                        No projects found. Add them via Admin Panel.
                    </div>
                )}

                {projects.map((project) => (
                    <div className="project-card reveal" key={project._id || project.title}>

                        <div className="project-info">
                            <h3 className="project-title">{project.title}</h3>
                            <p className="project-desc">{project.description}</p>
                            <div className="project-tech"><i className="fas fa-code"></i> {project.technologies || 'Tech Stack'}</div>
                            {project.link && (
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-btn">
                                    View Project <i className="fas fa-arrow-right"></i>
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Projects;
