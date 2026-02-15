import React from 'react';

const Background = () => {
    return (
        <>
            <video autoPlay muted loop playsInline id="bg-video" preload="auto">
                <source src="https://res.cloudinary.com/dyot8vo5t/video/upload/f_auto,q_auto/hero_qmyrxh.mp4" type="video/mp4" />
            </video>
            <div className="bg-overlay"></div>
        </>
    );
};

export default Background;
