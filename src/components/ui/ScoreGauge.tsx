interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreGauge({
  score,
  maxScore = 10,
  size = 'md',
  showLabel = false,
}: ScoreGaugeProps) {
  const percentage = (score / maxScore) * 100;

  const sizeConfig = {
    sm: { width: 40, strokeWidth: 3, fontSize: 'text-xs' },
    md: { width: 56, strokeWidth: 4, fontSize: 'text-base' },
    lg: { width: 72, strokeWidth: 5, fontSize: 'text-xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on score
  const getScoreColor = () => {
    if (score >= 8.5) return 'stroke-live';
    if (score >= 7.0) return 'stroke-copper';
    if (score >= 5.0) return 'stroke-busy';
    return 'stroke-closed';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-slate"
          />
          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-500 ${getScoreColor()}`}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono font-semibold text-ivory ${config.fontSize}`}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted mt-1">Score</span>
      )}
    </div>
  );
}
