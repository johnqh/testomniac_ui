import { useState } from 'react';
import {
  ActionButton,
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Label,
  LoadingState,
} from '@sudobility/components';
import {
  useCreateEntityCredential,
  useDeleteEntityCredential,
  useEntityCredentials,
  useUpdateEntityCredential,
} from '@sudobility/testomniac_client';
import type {
  AuthProvider,
  CreateEntityCredentialRequest,
  EntityCredentialResponse,
  UpdateEntityCredentialRequest,
} from '@sudobility/testomniac_types';
import { useTestomniacApi } from '../../context/config';
import { SelectField } from '../forms/SelectField';
import { EmptyState } from '../states';

const AUTH_PROVIDERS = [
  'email_password',
  'google',
  'apple',
  'microsoft',
  'twitter',
  'facebook',
  'github',
  'linkedin',
  'okta',
  'saml',
] as const satisfies readonly AuthProvider[];

const AUTH_PROVIDER_LABELS: Record<AuthProvider, string> = {
  email_password: 'Email / Password',
  google: 'Google',
  apple: 'Apple',
  microsoft: 'Microsoft',
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  okta: 'Okta',
  saml: 'SAML',
};

interface CredentialFormData {
  label: string;
  authProvider: AuthProvider;
  email: string;
  password: string;
  loginUrl: string;
}

const EMPTY_FORM: CredentialFormData = {
  label: '',
  authProvider: 'email_password',
  email: '',
  password: '',
  loginUrl: '',
};

interface CredentialManagementSectionProps {
  entitySlug: string;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function CredentialManagementSection({
  entitySlug,
  title = 'Login Credentials',
  description = 'Manage login credentials used for authenticated testing.',
  emptyTitle = 'No login credentials configured yet.',
  emptyDescription = 'Add credentials to enable authenticated test scenarios.',
}: CredentialManagementSectionProps) {
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const hookConfig = {
    networkClient,
    baseUrl,
    entitySlug,
    token,
  };

  const {
    credentials,
    isLoading: loadingCredentials,
    error: credentialsFetchError,
  } = useEntityCredentials({
    ...hookConfig,
    enabled: !!entitySlug && !!token,
  });

  const { createCredential, isCreating } = useCreateEntityCredential(hookConfig);
  const { updateCredential, isUpdating } = useUpdateEntityCredential(hookConfig);
  const { deleteCredential } = useDeleteEntityCredential(hookConfig);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>(EMPTY_FORM);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const credentialsError = mutationError || credentialsFetchError;
  const formSubmitting = isCreating || isUpdating;

  function openAddForm() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setMutationError(null);
    setShowForm(true);
  }

  function openEditForm(credential: EntityCredentialResponse) {
    setEditingId(credential.id);
    setFormData({
      label: credential.label,
      authProvider: credential.authProvider,
      email: credential.email || '',
      password: '',
      loginUrl: credential.loginUrl || '',
    });
    setMutationError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setMutationError(null);
  }

  async function handleFormSubmit() {
    if (!entitySlug || !formData.label.trim()) return;
    setMutationError(null);
    try {
      const body: UpdateEntityCredentialRequest = {
        label: formData.label.trim(),
        authProvider: formData.authProvider,
      };
      if (formData.email.trim()) body.email = formData.email.trim();
      if (formData.password) body.password = formData.password;
      if (formData.loginUrl.trim()) body.loginUrl = formData.loginUrl.trim();

      if (editingId) {
        await updateCredential({ credentialId: editingId, data: body });
      } else {
        await createCredential({
          entityId: entitySlug,
          ...body,
        } as CreateEntityCredentialRequest);
      }
      cancelForm();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to save credential');
    }
  }

  async function handleDelete(id: number) {
    if (!entitySlug) return;
    setDeletingId(id);
    setMutationError(null);
    try {
      await deleteCredential(id);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete credential');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="border-t border-gray-200 pt-6 dark:border-gray-700">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={openAddForm}>
            Add Credential
          </Button>
        )}
      </div>

      {credentialsError && (
        <Alert variant="error" className="mb-4" description={credentialsError} />
      )}

      {showForm && (
        <Card variant="bordered" className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
            {editingId ? 'Edit Credential' : 'New Credential'}
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block">Label *</Label>
              <Input
                type="text"
                value={formData.label}
                onChange={event => setFormData(prev => ({ ...prev, label: event.target.value }))}
                placeholder="e.g. Admin Account"
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 block">Auth Provider</Label>
              <SelectField
                value={formData.authProvider}
                onChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    authProvider: value as AuthProvider,
                  }))
                }
                options={AUTH_PROVIDERS.map(provider => ({
                  value: provider,
                  label: AUTH_PROVIDER_LABELS[provider],
                }))}
              />
            </div>

            <div>
              <Label className="mb-1 block">Email</Label>
              <Input
                type="text"
                value={formData.email}
                onChange={event => setFormData(prev => ({ ...prev, email: event.target.value }))}
                placeholder="user@example.com"
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 block">Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={event => setFormData(prev => ({ ...prev, password: event.target.value }))}
                placeholder={editingId ? '(unchanged if empty)' : 'Enter password'}
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1 block">Login URL (optional)</Label>
              <Input
                type="text"
                value={formData.loginUrl}
                onChange={event => setFormData(prev => ({ ...prev, loginUrl: event.target.value }))}
                placeholder="https://example.com/login"
                className="w-full"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <ActionButton
                variant="primary"
                isLoading={formSubmitting}
                loadingText="Saving..."
                onClick={handleFormSubmit}
                disabled={!formData.label.trim()}
              >
                {editingId ? 'Update' : 'Save'}
              </ActionButton>
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loadingCredentials ? (
        <LoadingState message="Loading credentials..." />
      ) : credentials.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {credentials.map(credential => (
            <Card
              key={credential.id}
              variant="bordered"
              padding="sm"
              className="flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {credential.label}
                  </span>
                  <Badge variant="default" size="sm">
                    {AUTH_PROVIDER_LABELS[credential.authProvider] || credential.authProvider}
                  </Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-3">
                  {credential.email && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {credential.email}
                    </p>
                  )}
                  {credential.hasPassword && (
                    <Badge variant="success" size="sm">
                      Password set
                    </Badge>
                  )}
                  {credential.loginUrl && (
                    <span className="max-w-full truncate text-xs text-gray-400 dark:text-gray-500 sm:max-w-[200px]">
                      {credential.loginUrl}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => openEditForm(credential)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive-outline"
                  size="sm"
                  type="button"
                  onClick={() => handleDelete(credential.id)}
                  disabled={deletingId === credential.id}
                >
                  {deletingId === credential.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
