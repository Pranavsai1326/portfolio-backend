import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

const Certifications = () => {
    const [modalImage, setModalImage] = useState(null);
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertifications = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/certifications`);
                const data = await res.json();
                setCerts(data);
            } catch (err) {
                console.error("Error fetching certifications:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCertifications();
    }, []);

    const openCert = (imgSrc) => {
        setModalImage(imgSrc);
    };

    const closeCert = () => {
        setModalImage(null);
    };

    return (
        <>
            <section id="certifications" className="section reveal">
                <h2 className="section-title">Certifications</h2>

                {loading ? (
                    <div className="glass-card" style={{ textAlign: 'center' }}>Loading Certifications...</div>
                ) : (
                    <div className="cert-grid">
                        {certs.map((cert, index) => (
                            <div className="cert-card" key={index} onClick={() => openCert(cert.imageUrl)}>
                                <img src={cert.imageUrl} alt={cert.title} />
                                <h3>{cert.title}</h3>
                                <p>{cert.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* MODAL */}
            <div
                id="certModal"
                className={`modal ${modalImage ? 'active' : ''}`}
                onClick={closeCert}
            >
                <span className="close" onClick={closeCert}>&times;</span>

                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    {modalImage && <img id="certImg" src={modalImage} alt="Certificate Preview" />}
                    {modalImage && (
                        <a id="certDownload" href={modalImage} className="btn btn-primary" download="certificate">
                            <i className="fas fa-download"></i> Download Certificate
                        </a>
                    )}
                </div>
            </div>
        </>
    );
};

export default Certifications;
