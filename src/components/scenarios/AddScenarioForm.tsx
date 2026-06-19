import { useState } from 'react';
import type { NetworkClient } from '@sudobility/types';
import type { PersonaResponse } from '@sudobility/testomniac_types';
import { useCreateTestScenario } from '@sudobility/testomniac_client';
import {
  ActionButton,
  Button,
  Card,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  TextArea,
} from '@sudobility/components';
import { useTestomniacApi } from '../../context/config';

interface AddScenarioFormProps {
  networkClient: NetworkClient;
  token: string;
  runnerId: number;
  personas: PersonaResponse[];
  defaultStartingPath?: string;
  onCreated: () => void;
  onCancel: () => void;
}

export function AddScenarioForm({
  networkClient,
  token,
  runnerId,
  personas,
  defaultStartingPath = '/',
  onCreated,
  onCancel,
}: AddScenarioFormProps) {
  const [title, setTitle] = useState('');
  const [startingPath, setStartingPath] = useState(defaultStartingPath);
  const [prompt, setPrompt] = useState('');
  const [personaId, setPersonaId] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { baseUrl } = useTestomniacApi();

  const createTestScenarioMutation = useCreateTestScenario(networkClient, baseUrl);
  const isCreating = createTestScenarioMutation.isPending;

  const handleCreate = async () => {
    if (!title.trim() || !prompt.trim()) return;
    setError(null);
    try {
      await createTestScenarioMutation.mutateAsync({
        token,
        runnerId,
        data: {
          runnerId,
          title: title.trim(),
          startingPath: startingPath.trim(),
          prompt: prompt.trim(),
          personaId,
        },
      });
      setTitle('');
      setStartingPath(defaultStartingPath);
      setPrompt('');
      setPersonaId(undefined);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scenario');
    }
  };

  return (
    <Card variant="bordered" className="space-y-3">
      <div>
        <Label className="mb-1 block">Title</Label>
        <Input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Add dish to cart and checkout"
          className="w-full"
        />
      </div>
      <div>
        <Label className="mb-1 block">Starting Path</Label>
        <Input
          type="text"
          value={startingPath}
          onChange={e => setStartingPath(e.target.value)}
          placeholder="e.g., /store"
          className="w-full"
        />
      </div>
      {personas.length > 0 && (
        <div>
          <Label className="mb-1 block">Persona</Label>
          <Select
            value={personaId !== undefined ? String(personaId) : ''}
            onValueChange={(value: string) => setPersonaId(value ? Number(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (optional)" />
            </SelectTrigger>
            <SelectContent>
              {personas.map(persona => (
                <SelectItem key={persona.id} value={String(persona.id)}>
                  {persona.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="mb-1 block">Prompt</Label>
        <TextArea
          value={prompt}
          onChange={setPrompt}
          placeholder="Describe the test flow in plain English. e.g., Browse the menu, add a pasta dish to the shopping cart, go to checkout, fill in shipping details, and complete the purchase."
          rows={4}
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <ActionButton
          variant="primary"
          isLoading={isCreating}
          loadingText="Creating..."
          onClick={handleCreate}
          disabled={!title.trim() || !prompt.trim()}
        >
          Create Scenario
        </ActionButton>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
