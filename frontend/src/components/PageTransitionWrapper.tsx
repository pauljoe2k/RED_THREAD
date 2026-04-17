'use client';

/**
 * PageTransitionWrapper
 *
 * Wraps each page in a fade + subtle slide animation.
 * Keyed by pathname so every route change triggers enter/exit.
 * Lives in the root layout — never touches the D3 graph.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

const transition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

interface Props {
  children: React.ReactNode;
}

export default function PageTransitionWrapper({ children }: Props) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
