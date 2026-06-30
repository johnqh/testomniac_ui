import { CodeBlock, Alert, Button } from '@sudobility/components';
import { useObjectScript, type ScriptKind } from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../../context/config';

interface ScriptPanelProps {
  kind: ScriptKind;
  id: number | undefined;
  /** Download filename, e.g. `interaction-3553.spec.ts`. */
  filename: string;
  title?: string;
  /** Only fetch when true (e.g. when an accordion is expanded). */
  enabled?: boolean;
}

function saveScript(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Reusable code view for a domain object's complete Playwright script, with a
 * copy button (from the shared CodeBlock) and a "Save Script" download button.
 */
export function ScriptPanel({
  kind,
  id,
  filename,
  title = 'Playwright Script',
  enabled = true,
}: ScriptPanelProps) {
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const scriptQuery = useObjectScript(networkClient, baseUrl, token ?? '', kind, id, {
    enabled,
  });
  const script = scriptQuery.data;
  const isLoading = scriptQuery.isLoading;
  const error = scriptQuery.error?.message ?? null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => script && saveScript(filename, script)}
          disabled={!script}
        >
          Save Script
        </Button>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-border bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          Generating script…
        </div>
      )}

      {!isLoading && error && <Alert variant="error" description={error} />}

      {!isLoading && !error && script && (
        <CodeBlock code={script} language="typescript" title={filename} showCopy showHeader />
      )}
    </div>
  );
}
