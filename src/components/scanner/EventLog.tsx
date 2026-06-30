import type { TestRunStreamEvent } from '@sudobility/testomniac_types';

interface EventLogProps {
  events: TestRunStreamEvent[];
  maxHeight?: string;
}

export function EventLog({ events, maxHeight = '300px' }: EventLogProps) {
  const renderPayload = (event: TestRunStreamEvent) => {
    const payload = event.payload as Record<string, unknown>;
    if (event.type === 'finding_created') {
      const title = String(payload.title ?? '');
      const description = String(payload.description ?? '');
      return (
        <div className="space-y-0.5">
          <div className="text-destructive">{title}</div>
          {description && (
            <div className="text-muted-foreground whitespace-pre-wrap break-words">
              {description}
            </div>
          )}
        </div>
      );
    }
    if (event.type === 'run_failed') {
      const error = String(payload.error ?? payload.status ?? '');
      return (
        <div className="text-destructive whitespace-pre-wrap break-words">
          {error || 'Run failed'}
        </div>
      );
    }

    return (
      <span className="text-muted-foreground break-words">{JSON.stringify(event.payload)}</span>
    );
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-muted px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          Event Log ({events.length})
        </span>
      </div>
      <div className="overflow-y-auto font-mono text-xs" style={{ maxHeight }}>
        {events.length === 0 ? (
          <div className="px-3 py-4 text-center text-muted-foreground">Waiting for events...</div>
        ) : (
          events.map((event, i) => (
            <div
              key={i}
              className="px-3 py-1.5 border-b border-border last:border-0 hover:bg-accent"
            >
              <span className="text-muted-foreground">
                {new Date(event.createdAt).toLocaleTimeString()}
              </span>{' '}
              <span className="text-info">{event.type}</span> {renderPayload(event)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
