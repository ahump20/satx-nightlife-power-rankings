interface StatusBadgeProps {
  isOpen: boolean;
  isBusy?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ isOpen, isBusy, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  if (!isOpen) {
    return (
      <span
        className={`status-closed rounded-full font-medium ${sizeClasses[size]}`}
      >
        Closed
      </span>
    );
  }

  if (isBusy) {
    return (
      <span
        className={`status-busy rounded-full font-medium ${sizeClasses[size]}`}
      >
        Busy
      </span>
    );
  }

  return (
    <span
      className={`status-live rounded-full font-medium ${sizeClasses[size]}`}
    >
      Open
    </span>
  );
}
