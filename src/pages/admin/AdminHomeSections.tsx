import { useState } from 'react';
import { useHomeSections, useUpdateHomeSection, useReorderHomeSections, HomeSection } from '@/hooks/useHomeSections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, LayoutDashboard } from 'lucide-react';

export default function AdminHomeSections() {
  const { data: sections, isLoading } = useHomeSections();
  const updateSection = useUpdateHomeSection();
  const reorderSections = useReorderHomeSections();
  const [localSections, setLocalSections] = useState<HomeSection[] | null>(null);

  const displaySections = localSections || sections || [];

  const handleVisibilityToggle = async (section: HomeSection) => {
    try {
      await updateSection.mutateAsync({
        id: section.id,
        updates: { is_visible: !section.is_visible },
      });
      toast.success(`${section.section_name} ${section.is_visible ? 'hidden' : 'shown'}`);
    } catch (error) {
      toast.error('Failed to update section visibility');
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...displaySections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    // Update display_order values
    const updatedSections = newSections.map((section, i) => ({
      ...section,
      display_order: i + 1,
    }));
    
    setLocalSections(updatedSections);
  };

  const saveOrder = async () => {
    if (!localSections) return;
    
    try {
      await reorderSections.mutateAsync(
        localSections.map(s => ({ id: s.id, display_order: s.display_order }))
      );
      setLocalSections(null);
      toast.success('Section order saved successfully');
    } catch (error) {
      toast.error('Failed to save section order');
    }
  };

  const cancelReorder = () => {
    setLocalSections(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home Page Sections</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home Page Sections</h1>
          <p className="text-muted-foreground">
            Control which sections appear on the home page and their order
          </p>
        </div>
        {localSections && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelReorder}>
              Cancel
            </Button>
            <Button onClick={saveOrder} disabled={reorderSections.isPending}>
              {reorderSections.isPending ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Section Management
          </CardTitle>
          <CardDescription>
            Toggle visibility and reorder sections. Changes to visibility take effect immediately.
            Use the arrows to reorder sections, then click "Save Order" to apply changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displaySections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  section.is_visible 
                    ? 'bg-card border-border' 
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className={`font-medium ${!section.is_visible && 'text-muted-foreground'}`}>
                        {section.section_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Key: {section.section_key}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Reorder buttons */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === displaySections.length - 1}
                      className="h-8 w-8"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Visibility toggle */}
                  <div className="flex items-center gap-2">
                    {section.is_visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={section.is_visible}
                      onCheckedChange={() => handleVisibilityToggle(section)}
                      disabled={updateSection.isPending}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            This is how sections will appear on the home page (visible sections only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displaySections
              .filter(s => s.is_visible)
              .map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center gap-3 p-3 rounded bg-primary/5 border border-primary/20"
                >
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{section.section_name}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
