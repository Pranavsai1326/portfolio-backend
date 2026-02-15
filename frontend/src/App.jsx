import React, { useEffect, useState } from 'react';
import API_BASE_URL from './config';
import Navbar from './components/Navbar';
import Preloader from './components/Preloader';
import Background from './components/Background';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import { Accomplishments, Strengths } from './components/AccomplishmentsStrengths';
import Certifications from './components/Certifications';
import { Contact } from './components/ContactFooter';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import { ReactLenis } from 'lenis/react';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Fetch Global Config (Favicon) - Run ONCE on mount
    fetch(`${API_BASE_URL}/api/about`)
      .then(res => res.json())
      .then(data => {
        if (data.favicon) {
          const link = document.querySelector("link[rel~='icon']");
          if (link) {
            link.href = data.favicon;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = data.favicon;
            document.head.appendChild(newLink);
          }
        }
      })
      .catch(err => console.error("Failed to fetch config", err));
  }, []);

  useEffect(() => {
    // 1. Reveal Animations - Run ONLY when loading finishes
    if (loading) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("active");
          }
        });
      },
      { threshold: 0.15 }
    );

    const checkReveal = () => {
      document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    };

    // Slight delay to ensure DOM is ready and preloader is fading
    const timer = setTimeout(() => {
      checkReveal();
    }, 100);

    return () => {
      obs.disconnect();
      clearTimeout(timer);
    };
  }, [loading]);

  return (
    <ReactLenis root options={{ lerp: 0.06, duration: 1.5, smoothWheel: true }}>
      <Background />

      {loading && <Preloader onExit={() => setLoading(false)} />}

      <div className={!loading ? "page-entry" : ""} style={{ opacity: loading ? 0 : 1 }}>
        <Navbar />

        <Hero />
        <About />
        <Projects />
        <Certifications />
        <Skills />
        <Accomplishments />
        <Strengths />
        <Contact />
        <Footer />
      </div>

      <CustomCursor />

      {/* MOBILE ANIMATED BACKGROUND */}
      <div className="mobile-bg">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </ReactLenis>
  );
}

export default App;
