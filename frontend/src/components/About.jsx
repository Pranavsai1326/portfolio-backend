import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

const About = () => {
    const [content, setContent] = useState('');

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/about`)
            .then(res => res.json())
            .then(data => setContent(data.content))
            .catch(err => console.error(err));
    }, []);

    return (
        <section id="about" className="section reveal">
            <h2 className="section-title">About Me</h2>
            <div className="glass-card interactive-tile">
                <p dangerouslySetInnerHTML={{ __html: content || "Loading..." }}></p>
            </div>
        </section>
    );
};

export default About;
