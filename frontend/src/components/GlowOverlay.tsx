import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const GlowOverlay: React.FC = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth out the mouse movement with spring physics
    const springConfig = { damping: 30, stiffness: 200 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none">
            {/* High Z-Index Glow that follows the mouse ABOVE content */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]"
                style={{
                    left: cursorX,
                    top: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            />

            {/* Subtle secondary glow for more depth */}
            <motion.div
                className="absolute w-[200px] h-[200px] rounded-full bg-blue-400/10 blur-[60px]"
                style={{
                    left: cursorX,
                    top: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                }}
                transition={{ type: "spring", damping: 40, stiffness: 250 }}
            />
        </div>
    );
};

export default GlowOverlay;
