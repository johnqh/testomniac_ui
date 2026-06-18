import { useState } from 'react';
import {
  ActionButton,
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  CodeDisplay,
  EmptyState,
  Input,
  Label,
  LoadingState,
  useCopyToClipboard,
} from '@sudobility/components';
import {
  type EntityApiKeyResponse,
  useCreateEntityApiKey,
  useDeleteEntityApiKey,
  useEntityApiKeys,
} from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../../context/config';

interface EntityApiKeysPanelProps {
  entitySlug: string;
  personalEntityId?: string | null;
}

export function EntityApiKeysPanel({ entitySlug, personalEntityId }: EntityApiKeysPanelProps) {
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const hookConfig = {
    networkClient,
    baseUrl,
    entitySlug,
    token,
  };

  const {
    apiKeys,
    isLoading: keysLoading,
    error: fetchError,
  } = useEntityApiKeys({
    ...hookConfig,
    enabled: !!entitySlug && !!token,
  });
  const { createApiKey, isCreating } = useCreateEntityApiKey(hookConfig);
  const { deleteApiKey } = useDeleteEntityApiKey(hookConfig);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [associatePersonal, setAssociatePersonal] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const { copyToClipboard, isCopied, resetCopiedState } = useCopyToClipboard();

  const visibleKeys = apiKeys.filter(
    key =>
      key.associatedPersonalEntityId === null ||
      (!!personalEntityId && key.associatedPersonalEntityId === personalEntityId)
  );
  const error = mutationError || fetchError;

  function openForm() {
    setTitle('');
    setAssociatePersonal(false);
    setMutationError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setTitle('');
    setAssociatePersonal(false);
    setMutationError(null);
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setMutationError(null);
    try {
      const result = await createApiKey({
        title: title.trim(),
        associatedPersonalEntityId: associatePersonal && personalEntityId ? personalEntityId : null,
      });
      setShowForm(false);
      setTitle('');
      setAssociatePersonal(false);
      setMutationError(null);
      if (result?.data?.apiKey) {
        setNewlyCreatedKey(result.data.apiKey);
        resetCopiedState();
      }
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  }

  function handleCopyKey() {
    if (!newlyCreatedKey) return;
    void copyToClipboard(newlyCreatedKey);
  }

  function dismissKeyBanner() {
    setNewlyCreatedKey(null);
    resetCopiedState();
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setMutationError(null);
    try {
      await deleteApiKey(id);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">API Keys</h2>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={openForm}>
            Create Key
          </Button>
        )}
      </div>

      {newlyCreatedKey && (
        <Alert variant="success" className="mb-4">
          {
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-1 font-medium">
                  API key created - copy it now, it will not be shown again.
                </p>
                <CodeDisplay variant="success" size="sm" wrap>
                  {newlyCreatedKey}
                </CodeDisplay>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCopyKey}>
                  {isCopied(newlyCreatedKey) ? 'Copied!' : 'Copy'}
                </Button>
                <Button type="button" variant="link" size="sm" onClick={dismissKeyBanner}>
                  Dismiss
                </Button>
              </div>
            </div>
          }
        </Alert>
      )}

      {error && <Alert variant="error" className="mb-4" description={error} />}

      {showForm && (
        <Card variant="bordered" className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">New API Key</h3>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Title *</Label>
              <Input
                type="text"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="e.g. CI Pipeline Key"
                className="w-full"
              />
            </div>

            {personalEntityId && (
              <Checkbox
                checked={associatePersonal}
                onChange={setAssociatePersonal}
                label="Associate with my personal account"
              />
            )}

            <div className="flex gap-2 pt-1">
              <ActionButton
                variant="primary"
                isLoading={isCreating}
                loadingText="Creating..."
                onClick={handleCreate}
                disabled={!title.trim()}
              >
                Create
              </ActionButton>
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {keysLoading ? (
        <LoadingState message="Loading API keys..." />
      ) : visibleKeys.length === 0 ? (
        <EmptyState title="No API keys for this workspace." />
      ) : (
        <div className="space-y-3">
          {visibleKeys.map(apiKey => (
            <ApiKeyRow
              key={apiKey.id}
              apiKey={apiKey}
              isPersonal={
                personalEntityId ? apiKey.associatedPersonalEntityId === personalEntityId : false
              }
              onDelete={() => handleDelete(apiKey.id)}
              isDeleting={deletingId === apiKey.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApiKeyRow({
  apiKey,
  isPersonal,
  onDelete,
  isDeleting,
}: {
  apiKey: EntityApiKeyResponse;
  isPersonal: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const maskedKey = apiKey.apiKey ? `${apiKey.apiKey.slice(0, 8)}${'*'.repeat(24)}` : '********';
  const createdAt = apiKey.createdAt
    ? new Date(apiKey.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Card variant="bordered" padding="sm" className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {apiKey.title}
          </span>
          {isPersonal && (
            <Badge variant="purple" size="sm">
              Personal
            </Badge>
          )}
        </div>
        <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">{maskedKey}</p>
        {createdAt && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Created {createdAt}</p>
        )}
      </div>
      <div className="ml-3 shrink-0">
        <Button
          variant="destructive-outline"
          size="sm"
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Card>
  );
}
