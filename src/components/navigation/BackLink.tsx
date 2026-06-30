import { ChevronLeftIcon } from '@heroicons/react/20/solid';

interface BackLinkProps {
  label: string;
  onClick: () => void;
}

export default function BackLink({ label, onClick }: BackLinkProps) {
  return (
    <button
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
