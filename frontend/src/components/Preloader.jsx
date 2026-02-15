import React, { useEffect, useState } from 'react';
import './Preloader.css';

const Preloader = ({ onExit }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // Minimum loading time to ensure the animation is seen (5 seconds)
        const minLoadTime = 5000;
        const startTime = Date.now();

        const handleLoad = () => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadTime - elapsedTime);

            setTimeout(() => {
                setExiting(true);
                // Wait for exit animation to finish before unmounting (1s)
                setTimeout(() => {
                    if (onExit) onExit();
                }, 1000);
            }, remainingTime);
        };

        // If document is already loaded
        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            window.addEventListener('load', handleLoad);
        }

        // Fallback safety timeout (7s max)
        const safetyTimeout = setTimeout(() => {
            if (!exiting) {
                setExiting(true);
                setTimeout(() => {
                    if (onExit) onExit();
                }, 1000);
            }
        }, 7000);

        return () => {
            window.removeEventListener('load', handleLoad);
            clearTimeout(safetyTimeout);
        };
    }, []);

    return (
        <div className={`preloader-container ${exiting ? 'exiting' : ''}`}>
            <div className="preloader-content">
                <div className="logo-container">
                    <span className="brand-name">Kuna Pranav Sai</span>
                </div>
                <div className="loading-text">Portfolio</div>
                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
};

export default Preloader;

