import { Card } from '@sudobility/components';
import { StatusBadge } from './StatusBadge';

interface RunSummaryCardProps {
  runId: number;
  status: string;
  phase?: string | null;
  startedAt?: string | null;
  pagesFound?: number;
  issuesFound?: number;
  onClick?: () => void;
}

export function RunSummaryCard({
  runId,
  status,
  phase,
  startedAt,
  pagesFound,
  issuesFound,
  onClick,
}: RunSummaryCardProps) {
  return (
    <Card
      variant="bordered"
      padding="md"
      onClick={onClick}
      className="hover:border-primary cursor-pointer transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Run #{runId}</span>
        <StatusBadge status={status} />
      </div>
      {phase && <div className="text-xs text-muted-foreground mb-1">Phase: {phase}</div>}
      <div className="flex gap-4 text-xs text-muted-foreground">
        {startedAt && <span>{new Date(startedAt).toLocaleDateString()}</span>}
        {pagesFound !== undefined && <span>{pagesFound} pages</span>}
        {issuesFound !== undefined && <span>{issuesFound} issues</span>}
      </div>
    </Card>
  );
}
