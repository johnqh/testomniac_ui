import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@sudobility/components';
import { useAddToBundle, useRunnerTestSurfaceBundles } from '@sudobility/testomniac_client';
import { useTestomniacApi } from '../../context/config';
import { useDashboardEnvironmentContext } from '../../hooks/useDashboardEnvironmentContext';

type ItemType = 'surface' | 'interaction' | 'scenario';

interface AddToBundleButtonProps {
  itemType: ItemType;
  itemId: number;
}

export function AddToBundleButton({ itemType, itemId }: AddToBundleButtonProps) {
  const { networkClient, token, primaryRunner } = useDashboardEnvironmentContext();
  const { baseUrl } = useTestomniacApi();
  const runnerId = primaryRunner?.id ?? 0;

  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const bundlesQuery = useRunnerTestSurfaceBundles(networkClient, baseUrl, token, runnerId, {
    enabled: !!token && !!primaryRunner,
  });
  const bundles = useMemo(() => bundlesQuery.data?.data ?? [], [bundlesQuery.data]);

  const nonDiscoveryBundles = useMemo(
    () => bundles.filter(b => b.title !== 'Discovery'),
    [bundles]
  );

  const addToBundleMutation = useAddToBundle(networkClient, baseUrl);
  const isAdding = addToBundleMutation.isPending;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = async (bundleId: number, bundleTitle: string) => {
    setOpen(false);
    setFeedback(null);
    try {
      await addToBundleMutation.mutateAsync({
        token,
        runnerId,
        bundleId,
        itemType,
        itemId,
      });
      setFeedback(`Added to "${bundleTitle}"`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Failed to add to bundle');
    }
  };

  if (!primaryRunner || nonDiscoveryBundles.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(prev => !prev)}
        disabled={isAdding}
      >
        {isAdding ? 'Adding...' : 'Add to Bundle'}
      </Button>
      {feedback && <span className="ml-2 text-xs text-success">{feedback}</span>}
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-border bg-popover py-1 shadow-lg">
          {nonDiscoveryBundles.map(bundle => (
            <button
              key={bundle.id}
              onClick={() => handleSelect(bundle.id, bundle.title)}
              className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
            >
              {bundle.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
