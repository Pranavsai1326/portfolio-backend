import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

export const Accomplishments = () => {
    const [content, setContent] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/content?type=accomplishment`)
            .then(res => res.json())
            .then(data => setContent(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <section id="accomplishments" className="section reveal">
            <h2 className="section-title">Accomplishments</h2>
            <div className="accomplishments-grid">
                {content.length > 0 ? (
                    content.map((item, i) => (
                        <div className="accomplishment-card" key={i}>
                            <p dangerouslySetInnerHTML={{ __html: item.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                        </div>
                    ))
                ) : (
                    <div className="glass-card">
                        <p>No accomplishments listed.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export const Strengths = () => {
    const [strengths, setStrengths] = useState([]);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/content?type=strength`)
            .then(res => res.json())
            .then(data => setStrengths(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <section id="strengths" className="section reveal">
            <h2 className="section-title">Strengths</h2>
            <div className="strengths-grid">
                {strengths.map((str, index) => (
                    <div className="strength-card" key={index}>{str.text}</div>
                ))}
            </div>
        </section>
    );
};
