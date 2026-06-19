import { useState } from 'react';
import {
  Alert,
  Button,
  ActionButton,
  Card,
  Input,
  Label,
  TextArea,
  ContentLayout,
  CardGrid,
} from '@sudobility/components';
import {
  useProductPersonas,
  useCreatePersona,
  useUpdatePersona,
  useDeletePersona,
  useDetectPersonas,
  usePersonaUseCases,
} from '@sudobility/testomniac_client';
import type { PersonaResponse } from '@sudobility/testomniac_types';
import { SEOHead, useTestomniacApi } from '../context/config';
import { useRouteParams } from '../context/routing';
import { AddButton } from '../components/ui/AddButton';
import { PersonaCell } from '../components/cells';
import { useDashboardEnvironmentContext } from '../hooks/useDashboardEnvironmentContext';
import { ErrorState, LoadingState, EmptyState } from '../components/states';

// ---------------------------------------------------------------------------
// Sub-component: Use Cases (expandable per persona)
// ---------------------------------------------------------------------------

function PersonaUseCases({ personaId }: { personaId: number }) {
  const { networkClient, token, baseUrl } = useTestomniacApi();
  const useCasesQuery = usePersonaUseCases(networkClient, baseUrl, token ?? '', personaId);
  const useCases = useCasesQuery.data?.data ?? [];
  const isLoading = useCasesQuery.isLoading;

  if (isLoading) {
    return <div className="text-xs text-gray-400 py-2">Loading use cases...</div>;
  }

  if (useCases.length === 0) {
    return <div className="text-xs text-gray-400 py-2">No use cases.</div>;
  }

  return (
    <div className="space-y-2">
      {useCases.map(uc => (
        <div key={uc.id} className="text-sm">
          <span className="font-medium text-gray-800 dark:text-gray-200">{uc.title}</span>
          {uc.description && (
            <span className="text-gray-500 dark:text-gray-400"> — {uc.description}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function PersonasPage() {
  const { envId } = useRouteParams<{ envId: string }>();
  const { baseUrl } = useTestomniacApi();
  const {
    networkClient,
    token,
    productId,
    isLoading: contextLoading,
    error: contextError,
  } = useDashboardEnvironmentContext();

  // Data
  const personasQuery = useProductPersonas(networkClient, baseUrl, token ?? '', productId ?? 0, {
    enabled: !!envId && !!token && !!productId,
  });
  const personas = personasQuery.data?.data ?? [];
  const isLoading = personasQuery.isLoading;
  const error = personasQuery.error?.message ?? null;
  const refetch = personasQuery.refetch;

  // Mutations
  const createPersonaMutation = useCreatePersona(networkClient, baseUrl);
  const isCreating = createPersonaMutation.isPending;
  const updatePersonaMutation = useUpdatePersona(networkClient, baseUrl);
  const isUpdating = updatePersonaMutation.isPending;
  const deletePersonaMutation = useDeletePersona(networkClient, baseUrl);
  const detectPersonasMutation = useDetectPersonas(networkClient, baseUrl);
  const isDetecting = detectPersonasMutation.isPending;

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaResponse | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Detect state
  const [showDetectWarning, setShowDetectWarning] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  // Expand state
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Handlers
  const openCreateForm = () => {
    setEditingPersona(null);
    setFormTitle('');
    setFormDescription('');
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (persona: PersonaResponse) => {
    setEditingPersona(persona);
    setFormTitle(persona.title);
    setFormDescription(persona.description ?? '');
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPersona(null);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    setFormError(null);
    try {
      if (editingPersona) {
        await updatePersonaMutation.mutateAsync({
          token: token ?? '',
          personaId: editingPersona.id,
          data: {
            title: formTitle.trim(),
            description: formDescription.trim() || undefined,
          },
        });
      } else {
        await createPersonaMutation.mutateAsync({
          token: token ?? '',
          data: {
            productId: productId!,
            title: formTitle.trim(),
            description: formDescription.trim(),
          },
        });
      }
      closeForm();
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (personaId: number) => {
    await deletePersonaMutation.mutateAsync({ token: token ?? '', personaId });
    refetch();
  };

  const handleDetect = async () => {
    if (personas.length > 0) {
      setShowDetectWarning(true);
      return;
    }
    await runDetect();
  };

  const runDetect = async () => {
    setShowDetectWarning(false);
    setDetectError(null);
    try {
      await detectPersonasMutation.mutateAsync({
        token: token ?? '',
        data: { productId: productId! },
      });
      refetch();
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : 'Detection failed');
    }
  };

  if (contextError || error) {
    return <ErrorState message={contextError || error || ''} />;
  }

  return (
    <ContentLayout
      header={
        <div className="border-b border-gray-200 bg-white px-4 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <SEOHead title="Personas" description="" noIndex />

          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Personas</h1>
            <div className="flex items-center gap-2">
              <ActionButton
                variant="primary"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleDetect}
                disabled={!productId}
                isLoading={isDetecting}
                loadingText="Detecting..."
              >
                Detect Personas
              </ActionButton>
              <AddButton
                label="New Persona"
                active={showForm}
                onClick={showForm ? closeForm : openCreateForm}
              />
            </div>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {/* Detect error */}
        {detectError && <Alert variant="error" description={detectError} className="mb-4" />}

        {/* Detect warning dialog */}
        {showDetectWarning && (
          <div className="mb-4 p-4 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Detecting personas will replace all {personas.length} existing persona
              {personas.length !== 1 ? 's' : ''}. This cannot be undone.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <ActionButton
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={runDetect}
                isLoading={isDetecting}
                loadingText="Detecting..."
              >
                Continue
              </ActionButton>
              <Button variant="secondary" size="sm" onClick={() => setShowDetectWarning(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Add / Edit form */}
        {showForm && (
          <Card variant="bordered" className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {editingPersona ? 'Edit Persona' : 'New Persona'}
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block">Title</Label>
                <Input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Power User, First-Time Visitor"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="mb-1 block">Description</Label>
                <TextArea
                  value={formDescription}
                  onChange={setFormDescription}
                  placeholder="Describe this persona's goals, behavior, and technical proficiency"
                  rows={3}
                />
              </div>
              {formError && (
                <div className="text-sm text-red-600 dark:text-red-400">{formError}</div>
              )}
              <div className="flex items-center gap-2">
                <ActionButton
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isCreating || isUpdating}
                  loadingText="Saving..."
                >
                  Save
                </ActionButton>
                <Button variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Loading */}
        {(contextLoading || isLoading) && <LoadingState message="Loading personas..." />}

        {/* Empty state */}
        {!isLoading && personas.length === 0 && !showForm && (
          <EmptyState
            title="No personas yet"
            description='Create a persona manually or use "Detect Personas" to generate them from your discovered pages.'
          />
        )}

        {/* Persona list */}
        {!isLoading && personas.length > 0 && (
          <>
            <CardGrid>
              {personas.map((persona: PersonaResponse) => (
                <PersonaCell
                  key={persona.id}
                  persona={persona}
                  variant="tile"
                  onClick={() => setExpandedId(expandedId === persona.id ? null : persona.id)}
                  actions={
                    <>
                      <Button variant="link" size="sm" onClick={() => openEditForm(persona)}>
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(persona.id)}
                      >
                        Delete
                      </Button>
                    </>
                  }
                />
              ))}
            </CardGrid>

            {/* Expanded use cases for the selected persona, rendered below the grid */}
            {expandedId != null && (
              <Card variant="bordered" className="mt-4">
                <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Use Cases — {personas.find(p => p.id === expandedId)?.title ?? ''}
                </h4>
                <PersonaUseCases personaId={expandedId} />
              </Card>
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
}
