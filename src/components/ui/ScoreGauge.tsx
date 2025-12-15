'use client';

import { useEffect, useState, useRef } from 'react';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export function ScoreGauge({
  score,
  maxScore = 10,
  size = 'md',
  showLabel = false,
  animated = true,
}: ScoreGaugeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const gaugeRef = useRef<HTMLDivElement>(null);

  const percentage = (score / maxScore) * 100;

  const sizeConfig = {
    sm: { width: 44, strokeWidth: 3.5, fontSize: 'text-sm', glowSize: '4px' },
    md: { width: 60, strokeWidth: 4.5, fontSize: 'text-lg', glowSize: '6px' },
    lg: { width: 80, strokeWidth: 5.5, fontSize: 'text-2xl', glowSize: '8px' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine gradient colors based on score
  const getGradientColors = () => {
    if (score >= 8.5) {
      return { start: '#22c55e', end: '#16a34a', glow: 'rgba(34, 197, 94, 0.4)' };
    }
    if (score >= 7.0) {
      return { start: '#d4956b', end: '#b87333', glow: 'rgba(184, 115, 51, 0.4)' };
    }
    if (score >= 5.0) {
      return { start: '#fbbf24', end: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' };
    }
    return { start: '#9ca3af', end: '#6b7280', glow: 'rgba(107, 114, 128, 0.3)' };
  };

  const colors = getGradientColors();
  const gradientId = `scoreGradient-${Math.random().toString(36).substr(2, 9)}`;

  // Intersection Observer for animation trigger
  useEffect(() => {
    if (!animated) {
      setIsVisible(true);
      setDisplayScore(score);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (gaugeRef.current) {
      observer.observe(gaugeRef.current);
    }

    return () => observer.disconnect();
  }, [animated, isVisible]);

  // Animate score number
  useEffect(() => {
    if (!isVisible || !animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000;
    const startTime = performance.now();
    const startScore = 0;

    const animateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentScore = startScore + (score - startScore) * easeOutCubic;

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [isVisible, score, animated]);

  return (
    <div className="flex flex-col items-center" ref={gaugeRef}>
      <div
        className="relative score-gauge"
        style={{
          width: config.width,
          height: config.width,
          filter: isVisible ? `drop-shadow(0 0 ${config.glowSize} ${colors.glow})` : 'none',
          transition: 'filter 0.5s ease'
        }}
      >
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
          style={{ overflow: 'visible' }}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
            {/* Glow filter */}
            <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-slate"
            opacity={0.3}
          />

          {/* Track circle (subtle) */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth - 1}
            className="text-charcoal"
          />

          {/* Progress circle with gradient */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isVisible ? offset : circumference}
            style={{
              transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              filter: `url(#glow-${gradientId})`,
            }}
          />

          {/* Highlight arc for depth */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={config.strokeWidth / 3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isVisible ? offset : circumference}
            style={{
              transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-mono font-semibold text-ivory ${config.fontSize}`}
            style={{
              textShadow: `0 0 10px ${colors.glow}`,
            }}
          >
            {displayScore.toFixed(1)}
          </span>
        </div>
      </div>

      {showLabel && (
        <span className="text-xs text-muted mt-1.5 tracking-wide uppercase">Score</span>
      )}
    </div>
  );
}
