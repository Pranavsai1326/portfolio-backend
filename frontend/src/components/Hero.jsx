import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import Greeting from './Greeting';

const Hero = () => {
    const [text, setText] = useState('');
    const [roles, setRoles] = useState([]);
    const [profileImage, setProfileImage] = useState("/assets/profile.jpg"); // Default
    const [resumeUrl, setResumeUrl] = useState("/assets/resume.pdf"); // Default
    const [tagline, setTagline] = useState("");
    const [name, setName] = useState("Kuna Pranav Sai"); // Default fallback

    useEffect(() => {
        // Fetch dynamic roles and config
        const fetchData = async () => {
            try {
                // Roles
                const rolesRes = await fetch(`${API_BASE_URL}/api/content?type=typing_role`);
                const rolesData = await rolesRes.json();
                if (rolesData.length > 0) {
                    setRoles(rolesData.map(d => d.text));
                } else {
                    setRoles([
                        "Salesforce Developer",
                        "Agentforce Specialist",
                        "PD-1 Certified Developer",
                        "AI & CRM Automation Enthusiast"
                    ]);
                }

                // Profile Image & Resume (from About/Config endpoint)
                const aboutRes = await fetch(`${API_BASE_URL}/api/about`);
                const aboutData = await aboutRes.json();
                if (aboutData.profileImage) {
                    setProfileImage(aboutData.profileImage);
                }
                if (aboutData.resumeUrl) {
                    setResumeUrl(aboutData.resumeUrl);
                }
                if (aboutData.tagline) {
                    setTagline(aboutData.tagline);
                }
                if (aboutData.name) {
                    setName(aboutData.name);
                }

            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (roles.length === 0) return;

        let r = 0, c = 0, typing = true;
        let timeoutId;

        const loop = () => {
            const currentRole = roles[r];
            if (typing) {
                setText(currentRole.slice(0, ++c));
                if (c === currentRole.length) {
                    typing = false;
                    timeoutId = setTimeout(loop, 2000);
                    return;
                }
            } else {
                setText(currentRole.slice(0, --c));
                if (c === 0) {
                    typing = true;
                    r = (r + 1) % roles.length;
                }
            }
            timeoutId = setTimeout(loop, typing ? 80 : 40);
        };

        loop();

        return () => clearTimeout(timeoutId);
    }, [roles]);

    return (
        <section id="home" className="hero reveal">
            <div className="hero-content">

                <div className="hero-image">
                    <img src={profileImage} alt={name} onError={(e) => { e.target.src = "/assets/profile.jpg" }} />
                </div>

                <div className="hero-card">
                    <Greeting />
                    <h1><span>{name}</span></h1>
                    <h3 id="typing" style={{ minHeight: '1.5em' }}>{text}</h3>

                    <p>
                        {tagline || "Salesforce Developer & AI enthusiast passionate about CRM automation, AI-driven analytics, and scalable business solutions."}
                    </p>

                    <div className="hero-buttons">
                        <a href="mailto:pranavsaikuna634@gmail.com" className="btn btn-primary">
                            Hire Me
                        </a>

                        <a href={resumeUrl} className="btn btn-secondary resume-btn" download target="_blank" rel="noopener noreferrer">
                            <i className="fas fa-download"></i> Resume
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Hero;
