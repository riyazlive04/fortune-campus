import React from 'react';
import { motion } from 'framer-motion';

const ModernBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none bg-white">
            {/* Mesh Gradient blobs for soft depth */}
            <motion.div
                animate={{
                    x: [0, 80, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -top-[5%] -left-[5%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[100px]"
            />

            <motion.div
                animate={{
                    x: [0, -80, 0],
                    y: [0, 60, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute top-[15%] -right-[5%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[90px]"
            />

            {/* Sharp Geometric Grid Overlay */}
            <div className="absolute inset-0 h-full w-full bg-white bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]">
                {/* Fade effect at the edges */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-90" />
            </div>

            {/* Subtle decorative "Square" accents */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div className="grid grid-cols-10 grid-rows-10 gap-0 w-full h-full">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 10, repeat: Infinity, delay: i * 2 }}
                            className="bg-primary m-4 rounded-sm"
                            style={{
                                gridColumnStart: (i * 3) % 10 + 1,
                                gridRowStart: (i * 2) % 10 + 1,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModernBackground;
