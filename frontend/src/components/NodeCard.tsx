'use client';

/**
 * NodeCard
 * Animated with Framer Motion — scale on hover, tap feedback.
 * The D3 graph is completely separate and untouched.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';

interface NodeCardProps {
  node: {
    _id: string;
    title: string;
    description: string;
    tags: string[];
    createdBy: { username: string };
    createdAt: string;
  };
}

export default function NodeCard({ node }: NodeCardProps) {
  return (
    <motion.div
      whileHover={{
        scale: 1.025,
        boxShadow: '0 8px 28px rgba(220, 38, 38, 0.13)',
      }}
      whileTap={{ scale: 0.975 }}
      transition={{ type: 'tween', duration: 0.15, ease: 'easeInOut' }}
      // Keep border-radius consistent with the inner card
      style={{ borderRadius: '0.5rem' }}
    >
      <Link href={`/nodes/${node._id}`} id={`node-card-${node._id}`}>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-red-800 h-full cursor-pointer">
          {/* Title */}
          <h2 className="font-semibold text-gray-100 text-sm leading-snug mb-2 line-clamp-2">
            {node.title}
          </h2>

          {/* Description excerpt */}
          <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-3">
            {node.description}
          </p>

          {/* Tags */}
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {node.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-700 border border-gray-600 text-gray-300 text-xs px-1.5 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
              {node.tags.length > 4 && (
                <span className="text-gray-500 text-xs">+{node.tags.length - 4}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">{node.createdBy.username}</span>
            <span className="text-gray-600 text-xs">
              {new Date(node.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
