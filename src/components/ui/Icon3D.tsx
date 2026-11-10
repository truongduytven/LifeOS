'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export type Icon3DName =
  | 'logo'
  | 'rocket'
  | 'star'
  | 'chart'
  | 'tick'
  | 'calendar'
  | 'clock'
  | 'flag'
  | 'target'
  | 'pin'
  | 'bulb'
  | 'pencil'
  | 'notebook'
  | 'bookmark'
  | 'glasses'
  | 'file-text'
  | 'folder'
  | 'file'
  | 'lock'
  | 'shield'
  | 'key';

export interface Icon3DProps {
  name: Icon3DName;
  size?: number;
  className?: string;
  float?: boolean;
  priority?: boolean;
}

export function Icon3D({
  name,
  size = 32,
  className = '',
  float = false,
  priority = false,
}: Icon3DProps) {
  const src = `/icons/3d/${name}.png`;

  return (
    <motion.span
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={
        float
          ? {
              y: [-2, 2, -2],
              rotate: [0, 1.5, -1.5, 0],
            }
          : undefined
      }
      transition={
        float
          ? {
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : undefined
      }
      whileHover={{
        scale: 1.1,
        rotate: [0, -3, 3, 0],
        transition: { duration: 0.35, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.95 }}
    >
      <Image
        src={src}
        alt={`${name} 3D icon`}
        width={size * 2}
        height={size * 2}
        priority={priority}
        unoptimized
        className="w-full h-full object-contain filter drop-shadow-[0_6px_12px_rgba(15,23,42,0.12)] transition-all duration-300 pointer-events-none"
      />
    </motion.span>
  );
}

export default Icon3D;
