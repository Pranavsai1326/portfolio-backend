import React, { useEffect, useState } from 'react';

const Greeting = () => {
    const [greeting, setGreeting] = useState('');
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) return 'Good Morning';
            if (hour >= 12 && hour < 17) return 'Good Afternoon';
            if (hour >= 17 && hour < 21) return 'Good Evening';
            return 'Good Night';
        };

        setGreeting(getGreeting());

        // Session-based animation logic
        const hasAnimated = sessionStorage.getItem('greetingAnimated');
        if (!hasAnimated) {
            setShouldAnimate(true);
            sessionStorage.setItem('greetingAnimated', 'true');
        }
    }, []);

    return (
        <div className={`greeting-container ${shouldAnimate ? 'animate-greeting' : 'static-greeting'}`}>
            <span className="greeting-text">
                {greeting}, Welcome to my portfolio
            </span>
            <div className="greeting-dot"></div>
        </div>
    );
};

export default Greeting;
