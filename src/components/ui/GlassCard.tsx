'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  glowColor?: 'sapphire' | 'sunset' | 'emerald' | 'none';
  onClick?: () => void;
  padding?: string;
}

export default function GlassCard({
  children,
  className = '',
  tilt = true,
  glowColor = 'none',
  onClick,
  padding = 'p-5 sm:p-6',
  style,
  ...rest
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [canTilt, setCanTilt] = useState(false);
  const [tiltState, setTiltState] = useState({
    rotateX: 0,
    rotateY: 0,
    spotX: 50,
    spotY: 50,
    isHovered: false,
  });

  useEffect(() => {
    // Only enable 3D pointer tilt if device supports fine hover and user has not requested reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setCanTilt(tilt && !prefersReduced && canHover);
  }, [tilt]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const normX = px * 2 - 1; // -1 to 1
    const normY = py * 2 - 1; // -1 to 1

    const MAX_TILT_DEG = 4; // ±4deg max
    const rotateX = -normY * MAX_TILT_DEG;
    const rotateY = normX * MAX_TILT_DEG;

    setTiltState({
      rotateX,
      rotateY,
      spotX: Math.round(px * 100),
      spotY: Math.round(py * 100),
      isHovered: true,
    });
  };

  const handlePointerLeave = () => {
    if (!canTilt) return;
    setTiltState((prev) => ({
      ...prev,
      rotateX: 0,
      rotateY: 0,
      isHovered: false,
    }));
  };

  const getGlowClasses = () => {
    switch (glowColor) {
      case 'sapphire':
        return 'hover:border-sapphire-400/50 hover:shadow-[0_16px_36px_-4px_rgba(30,90,168,0.2),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:hover:border-sapphire-500/50 dark:hover:shadow-[0_18px_40px_-4px_rgba(30,90,168,0.35),inset_0_1px_0_0_rgba(255,255,255,0.2)]';
      case 'sunset':
        return 'hover:border-sunset-400/50 hover:shadow-[0_16px_36px_-4px_rgba(245,130,32,0.2),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:hover:border-sunset-500/50 dark:hover:shadow-[0_18px_40px_-4px_rgba(245,130,32,0.35),inset_0_1px_0_0_rgba(255,255,255,0.2)]';
      case 'emerald':
        return 'hover:border-emerald-400/50 hover:shadow-[0_16px_36px_-4px_rgba(16,185,129,0.2),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:hover:border-emerald-500/50 dark:hover:shadow-[0_18px_40px_-4px_rgba(16,185,129,0.35),inset_0_1px_0_0_rgba(255,255,255,0.2)]';
      default:
        return 'hover:border-white/90 dark:hover:border-white/20 hover:shadow-[0_14px_34px_-4px_rgba(30,90,168,0.12),inset_0_1px_0_0_rgba(255,255,255,0.95)] dark:hover:shadow-[0_16px_36px_-4px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)]';
    }
  };

  const isClickable = Boolean(onClick);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`relative rounded-3xl bg-[#FFFCF7]/75 dark:bg-[#111F38]/75 backdrop-blur-xl saturate-160 border border-white/70 dark:border-white/10 shadow-[0_10px_30px_-5px_rgba(30,90,168,0.07),0_4px_12px_-2px_rgba(245,130,32,0.04),inset_0_1px_0_0_rgba(255,255,255,0.85)] dark:shadow-[0_12px_36px_0_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12)] overflow-hidden transition-all duration-300 ${
        isClickable ? 'cursor-pointer active:scale-[0.985]' : ''
      } ${getGlowClasses()} ${padding} ${className}`}
      style={{
        transform:
          canTilt && tiltState.isHovered
            ? `perspective(1000px) rotateX(${tiltState.rotateX.toFixed(2)}deg) rotateY(${tiltState.rotateY.toFixed(2)}deg)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: tiltState.isHovered
          ? 'transform 0.08s ease-out'
          : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease',
        ...style,
      }}
      {...rest}
    >
      {/* Specular Radial Highlight on Hover */}
      {canTilt && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            opacity: tiltState.isHovered ? 1 : 0,
            background: `radial-gradient(circle 260px at ${tiltState.spotX}% ${tiltState.spotY}%, rgba(255, 255, 255, 0.22), transparent 70%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Card Content */}
      <div className="relative z-20 w-full min-w-0">{children}</div>
    </div>
  );
}
