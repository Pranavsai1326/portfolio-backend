import React, { useState, useEffect } from 'react';

const Navbar = () => {
    const [active, setActive] = useState(false);

    const toggleMenu = () => {
        setActive(!active);
    };

    const closeMenu = () => {
        setActive(false);
    };

    // Close menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', closeMenu);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', closeMenu);
        };
    }, []);

    const handleScroll = (e, targetId) => {
        e.preventDefault();
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
            closeMenu();
        }
    };

    return (
        <header>
            <h2 className="logo">Kuna Pranav Sai</h2>

            <div className={`hamburger ${active ? 'active' : ''}`} id="hamburger" onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <nav id="navMenu" className={active ? 'active' : ''}>
                <a href="#home" onClick={(e) => handleScroll(e, '#home')}>Home</a>
                <a href="#about" onClick={(e) => handleScroll(e, '#about')}>About Me</a>
                <a href="#projects" onClick={(e) => handleScroll(e, '#projects')}>Projects</a>
                <a href="#certifications" onClick={(e) => handleScroll(e, '#certifications')}>Certifications</a>
                <a href="#skills" onClick={(e) => handleScroll(e, '#skills')}>Technical Skills</a>
                <a href="#accomplishments" onClick={(e) => handleScroll(e, '#accomplishments')}>Accomplishments</a>
                <a href="#strengths" onClick={(e) => handleScroll(e, '#strengths')}>Strengths</a>
                <a href="#contact" onClick={(e) => handleScroll(e, '#contact')}>Get In Touch</a>
            </nav>
        </header>
    );
};

export default Navbar;
