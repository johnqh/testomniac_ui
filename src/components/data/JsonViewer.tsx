interface JsonViewerProps {
  data: unknown;
}

export function JsonViewer({ data }: JsonViewerProps) {
  return (
    <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto text-foreground">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
