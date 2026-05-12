export function FlagPeru({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'size-5'}
    >
      <rect width="24" height="24" rx="4" fill="#D91023" />
      <rect x="8" width="8" height="24" fill="white" />
    </svg>
  );
}
