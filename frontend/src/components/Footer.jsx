import React from 'react';
import './Footer.css';
import { useLenis } from 'lenis/react';

const Footer = () => {
    const lenis = useLenis();

    const handleScroll = (e, targetId) => {
        e.preventDefault();
        if (lenis) {
            lenis.scrollTo(targetId, {
                offset: -80, // Header offset
                duration: 1.5
            });
        } else {
            // Fallback
            const element = document.querySelector(targetId);
            if (element) {
                const headerOffset = 80;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer reveal">
            <div className="footer-content">
                {/* Brand Section */}
                <div className="footer-brand">
                    <h2>Kuna Pranav Sai</h2>
                    <p className="footer-tagline">
                        Salesforce Developer & AI enthusiast passionate about creating scalable, automated, and intelligent business solutions.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul className="footer-links">
                        <li><a href="#home" onClick={(e) => handleScroll(e, '#home')}><i className="fas fa-chevron-right"></i> Home</a></li>
                        <li><a href="#about" onClick={(e) => handleScroll(e, '#about')}><i className="fas fa-chevron-right"></i> About</a></li>
                        <li><a href="#projects" onClick={(e) => handleScroll(e, '#projects')}><i className="fas fa-chevron-right"></i> Projects</a></li>
                        <li><a href="#skills" onClick={(e) => handleScroll(e, '#skills')}><i className="fas fa-chevron-right"></i> Skills</a></li>
                        <li><a href="#contact" onClick={(e) => handleScroll(e, '#contact')}><i className="fas fa-chevron-right"></i> Get In Touch</a></li>
                    </ul>
                </div>

                {/* Socials & Contact */}
                <div className="footer-section">
                    <h3>Connect</h3>
                    <div className="footer-socials">
                        <a href="https://www.linkedin.com/in/pranavsaikuna" target="_blank" rel="noreferrer" className="social-icon" aria-label="LinkedIn">
                            <i className="fab fa-linkedin-in"></i>
                        </a>
                        <a href="https://github.com/Pranavsai1326" target="_blank" rel="noreferrer" className="social-icon" aria-label="GitHub">
                            <i className="fab fa-github"></i>
                        </a>
                        <a href="https://www.instagram.com/_mr.unidentified_" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="https://unstop.com/u/pranakun12997" target="_blank" rel="noreferrer" className="social-icon" aria-label="Unstop">
                            <i className="fas fa-briefcase"></i>
                        </a>
                    </div>
                </div>
            </div>

            <div className="footer-copyright">
                <p>&copy; {currentYear} Designed and Implemented by Kuna Pranav Sai. All Rights Reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
