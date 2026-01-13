import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  BarChart3,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  TrendingUp,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromoCodeForm } from '@/components/promo/PromoCodeForm';
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
  usePromoCodeStats,
  useAllPromoCodeUses,
  PromoCode,
  CreatePromoCodeData,
} from '@/hooks/usePromoCodes';
import { toast } from 'sonner';

export default function AdminPromoCodes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deletePromo, setDeletePromo] = useState<PromoCode | null>(null);
  const [viewStatsPromo, setViewStatsPromo] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: promoCodes, isLoading } = usePromoCodes();
  const { data: allUses } = useAllPromoCodeUses();
  const { data: promoStats } = usePromoCodeStats(viewStatsPromo?.id);
  const createMutation = useCreatePromoCode();
  const updateMutation = useUpdatePromoCode();
  const deleteMutation = useDeletePromoCode();

  const handleCreate = (data: CreatePromoCodeData) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsCreateOpen(false),
    });
  };

  const handleUpdate = (data: CreatePromoCodeData) => {
    if (!editingPromo) return;
    updateMutation.mutate({ id: editingPromo.id, ...data }, {
      onSuccess: () => setEditingPromo(null),
    });
  };

  const handleDelete = () => {
    if (!deletePromo) return;
    deleteMutation.mutate(deletePromo.id, {
      onSuccess: () => setDeletePromo(null),
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Promo code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (promo: PromoCode) => {
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = promo.end_date ? new Date(promo.end_date) : null;

    if (!promo.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (startDate > now) {
      return <Badge variant="outline" className="text-blue-600">Scheduled</Badge>;
    }
    if (endDate && endDate < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return <Badge variant="destructive">Exhausted</Badge>;
    }
    return <Badge className="bg-green-600">Active</Badge>;
  };

  // Calculate stats
  const totalDiscountGiven = allUses?.reduce((sum, use) => sum + Number(use.discount_applied), 0) || 0;
  const totalUses = allUses?.length || 0;
  const activePromoCodes = promoCodes?.filter(p => p.is_active && (!p.end_date || new Date(p.end_date) > new Date())).length || 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo Codes</h1>
          <p className="text-muted-foreground">Create and manage discount codes</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Promo Code
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Promo Codes</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promoCodes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePromoCodes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Discount Given</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalDiscountGiven.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
          <CardDescription>Manage your discount codes and track usage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes?.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-bold">
                        {promo.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyCode(promo.code)}
                      >
                        {copiedCode === promo.code ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                        {promo.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {promo.discount_type === 'percentage' ? (
                        <>
                          <Percent className="h-3 w-3" />
                          <span>{promo.discount_value}%</span>
                        </>
                      ) : (
                        <>
                          <IndianRupee className="h-3 w-3" />
                          <span>{promo.discount_value}</span>
                        </>
                      )}
                    </div>
                    {promo.min_order_amount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Min: ₹{promo.min_order_amount}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {promo.uses_count} / {promo.max_uses || '∞'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(promo.start_date), 'MMM d, yyyy')}
                      </div>
                      {promo.end_date && (
                        <div className="text-muted-foreground">
                          to {format(new Date(promo.end_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(promo)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {promo.applies_to === 'all' ? 'Platform' : 'Seller'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewStatsPromo(promo)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPromo(promo)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => setDeletePromo(promo)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!promoCodes || promoCodes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No promo codes yet. Create your first one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Create a new discount code for your customers
            </DialogDescription>
          </DialogHeader>
          <PromoCodeForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPromo} onOpenChange={() => setEditingPromo(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
            <DialogDescription>
              Update the promo code settings
            </DialogDescription>
          </DialogHeader>
          {editingPromo && (
            <PromoCodeForm
              initialData={editingPromo}
              onSubmit={handleUpdate}
              onCancel={() => setEditingPromo(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!viewStatsPromo} onOpenChange={() => setViewStatsPromo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Usage Stats: <code className="bg-muted px-2 py-1 rounded">{viewStatsPromo?.code}</code>
            </DialogTitle>
            <DialogDescription>
              View detailed usage statistics for this promo code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{viewStatsPromo?.uses_count || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Uses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    ₹{promoStats?.reduce((sum, use) => sum + Number(use.discount_applied), 0).toFixed(0) || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Discount Given</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">
                    {viewStatsPromo?.max_uses 
                      ? `${((viewStatsPromo.uses_count / viewStatsPromo.max_uses) * 100).toFixed(0)}%`
                      : '∞'}
                  </div>
                  <p className="text-sm text-muted-foreground">Usage Rate</p>
                </CardContent>
              </Card>
            </div>

            {promoStats && promoStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Discount Applied</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoStats.map((use) => (
                    <TableRow key={use.id}>
                      <TableCell>
                        <code className="text-sm">#{use.order?.order_number}</code>
                      </TableCell>
                      <TableCell>₹{Number(use.discount_applied).toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(use.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No usage data yet
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePromo} onOpenChange={() => setDeletePromo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the promo code "{deletePromo?.code}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
