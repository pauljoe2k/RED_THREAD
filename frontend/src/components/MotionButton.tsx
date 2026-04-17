'use client';

/**
 * MotionButton
 *
 * Drop-in replacement for <button> that adds:
 * - Hover: slight brightness lift (no layout shift)
 * - Tap:   scale 0.97 feedback
 *
 * Accepts all standard HTML button attributes + Framer Motion props.
 * Caller-provided whileHover/whileTap override the defaults.
 */

import { motion, type HTMLMotionProps } from 'framer-motion';

type MotionButtonProps = HTMLMotionProps<'button'>;

export default function MotionButton({ children, ...props }: MotionButtonProps) {
  return (
    <motion.button
      whileHover={{ filter: 'brightness(1.1)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: 'easeInOut' }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
