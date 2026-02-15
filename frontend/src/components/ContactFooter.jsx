import React, { useState } from 'react';
import API_BASE_URL from '../config';

export const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState(''); // 'sending', 'success', 'error'
    const [showReset, setShowReset] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', subject: '', message: '' });
                // Delay for "Send Another Message" button
                setTimeout(() => {
                    setShowReset(true);
                }, 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const handleReset = () => {
        setStatus('');
        setShowReset(false);
    };

    return (
        <section id="contact" className="section reveal">
            <h2 className="section-title">Get In Touch</h2>

            <div className="contact-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

                {/* Contact Info */}
                <div className="glass-card interactive-tile" style={{ padding: '40px' }}>
                    <h3 style={{ marginBottom: '25px', color: '#ffdd57', fontSize: '1.8rem' }}>Contact Info</h3>

                    <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
                        <i className="fas fa-envelope" style={{ width: '30px', color: '#ffdd57', fontSize: '1.2rem' }}></i>
                        <a href="mailto:pranavsaikuna634@gmail.com" style={{ color: '#fff', textDecoration: 'none' }}> pranavsaikuna634@gmail.com</a>
                    </p>

                    <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
                        <i className="fas fa-phone" style={{ width: '30px', color: '#ffdd57', fontSize: '1.2rem' }}></i>
                        <a href="tel:+919704347240" style={{ color: '#fff', textDecoration: 'none' }}> +91 9704347240</a>
                    </p>

                    <h4 style={{ marginTop: '40px', marginBottom: '20px', color: '#ddd', fontSize: '1.4rem' }}>Connect with me</h4>
                    <div className="contact-socials">
                        <a href="https://www.linkedin.com/in/pranavsaikuna" target="_blank" rel="noreferrer" style={{ fontSize: '1.5rem', marginRight: '15px' }}><i className="fab fa-linkedin-in"></i></a>
                        <a href="https://github.com/Pranavsai1326" target="_blank" rel="noreferrer" style={{ fontSize: '1.5rem', marginRight: '15px' }}><i className="fab fa-github"></i></a>
                        <a href="https://www.instagram.com/_mr.unidentified_" target="_blank" rel="noreferrer" style={{ fontSize: '1.5rem', marginRight: '15px' }}><i className="fab fa-instagram"></i></a>
                        <a href="https://unstop.com/u/pranakun12997" target="_blank" rel="noreferrer" style={{ fontSize: '1.5rem' }}><i className="fas fa-briefcase"></i></a>
                    </div>
                </div>

                {/* Contact Form Container with transitions */}
                <div className="glass-card interactive-tile" style={{ position: 'relative', minHeight: '400px', overflow: 'hidden' }}>
                    {/* Success Message View */}
                    <div
                        className={`success-view ${status === 'success' ? 'active' : ''}`}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '20px',
                            opacity: status === 'success' ? 1 : 0,
                            visibility: status === 'success' ? 'visible' : 'hidden',
                            transition: 'opacity 0.6s ease-in-out',
                            zIndex: 10
                        }}
                    >
                        <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#28a745', marginBottom: '20px', animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}></i>
                        <h3 style={{ color: '#fff', marginBottom: '10px', fontSize: '1.8rem' }}>Thank You!</h3>
                        <p style={{ color: '#ccc', fontSize: '1.1rem', maxWidth: '80%', lineHeight: '1.6' }}>
                            I appreciate you reaching out.<br />Your message has been received, and I will get back to you shortly.
                        </p>

                        {showReset && (
                            <button
                                onClick={handleReset}
                                className="btn btn-outline"
                                style={{
                                    marginTop: '30px',
                                    animation: 'fadeIn 1s ease-in-out forwards',
                                    padding: '10px 25px',
                                    border: '1px solid #ffdd57',
                                    color: '#ffdd57',
                                    background: 'transparent',
                                    borderRadius: '50px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
                                Send Another Message
                            </button>
                        )}
                    </div>

                    {/* Form View */}
                    <form
                        onSubmit={handleSubmit}
                        className={status === 'success' ? 'form-exit' : ''}
                        style={{
                            opacity: status === 'success' ? 0 : 1,
                            visibility: status === 'success' ? 'hidden' : 'visible',
                            transition: 'opacity 0.5s ease-in-out',
                            position: 'relative',
                            zIndex: 5
                        }}
                    >
                        {[
                            { label: 'Name', name: 'name', type: 'text' },
                            { label: 'Email', name: 'email', type: 'email' },
                            { label: 'Subject', name: 'subject', type: 'text' }
                        ].map((field, index) => (
                            <div key={field.name} style={{ marginBottom: '20px', animation: status === 'success' ? `slideUpFadeOut 0.5s forwards ${index * 0.1}s` : 'none' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ddd' }}>{field.label}</label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        ))}

                        <div style={{ marginBottom: '20px', animation: status === 'success' ? `slideUpFadeOut 0.5s forwards 0.3s` : 'none' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#ddd' }}>Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    outline: 'none',
                                    resize: 'vertical'
                                }}
                            ></textarea>
                        </div>

                        <div style={{ animation: status === 'success' ? `slideUpFadeOut 0.5s forwards 0.4s` : 'none' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={status === 'sending'}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {status === 'sending' ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>

                        {status === 'error' && (
                            <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(220, 53, 69, 0.2)', color: '#dc3545', borderRadius: '5px', textAlign: 'center' }}>
                                Failed to send message. Please try again.
                            </div>
                        )}
                    </form>
                </div>

            </div>
        </section>
    );
};


