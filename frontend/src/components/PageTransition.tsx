import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -15, scale: 0.98, filter: "blur(5px)" }}
            transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1], // Custom extremely smooth ease-out (cubic-bezier)
                opacity: { duration: 0.4 },
                filter: { duration: 0.4 }
            }}
            className={`w-full h-full transform-gpu ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
