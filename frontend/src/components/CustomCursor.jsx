import React, { useEffect } from 'react';

const CustomCursor = () => {
    useEffect(() => {
        if (!window.matchMedia("(pointer: fine)").matches) return;

        const handleMouseDown = (e) => {
            const fragments = 10; // number of pieces

            for (let i = 0; i < fragments; i++) {
                const frag = document.createElement("span");
                frag.className = "cursor-fragment";

                const x = (Math.random() - 0.5) * 80;
                const y = (Math.random() - 0.5) * 80;

                frag.style.left = e.clientX + "px";
                frag.style.top = e.clientY + "px";
                frag.style.setProperty("--x", `${x}px`);
                frag.style.setProperty("--y", `${y}px`);

                document.body.appendChild(frag);

                setTimeout(() => frag.remove(), 500);
            }
        };

        document.addEventListener("mousedown", handleMouseDown);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
        };
    }, []);

    return (
        <div className="custom-cursor"></div>
    );
};

export default CustomCursor;
