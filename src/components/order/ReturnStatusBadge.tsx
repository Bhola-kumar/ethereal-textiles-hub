import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Package, Loader2, Banknote } from 'lucide-react';

interface ReturnStatusBadgeProps {
  status: string;
  refundStatus?: string | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    label: 'Pending Review',
  },
  approved: {
    icon: <CheckCircle className="h-3 w-3" />,
    color: 'bg-green-500/20 text-green-600 border-green-500/30',
    label: 'Approved',
  },
  rejected: {
    icon: <XCircle className="h-3 w-3" />,
    color: 'bg-red-500/20 text-red-600 border-red-500/30',
    label: 'Rejected',
  },
  processing: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    label: 'Processing',
  },
  completed: {
    icon: <Package className="h-3 w-3" />,
    color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    label: 'Completed',
  },
};

const refundStatusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    label: 'Refund Pending',
  },
  processing: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    color: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    label: 'Refund Processing',
  },
  processed: {
    icon: <Banknote className="h-3 w-3" />,
    color: 'bg-green-500/20 text-green-600 border-green-500/30',
    label: 'Refunded',
  },
  rejected: {
    icon: <XCircle className="h-3 w-3" />,
    color: 'bg-red-500/20 text-red-600 border-red-500/30',
    label: 'Refund Rejected',
  },
};

export function ReturnStatusBadge({ status, refundStatus }: ReturnStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const refundConfig = refundStatus ? refundStatusConfig[refundStatus] : null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className={`${config.color} border text-xs`}>
        {config.icon}
        <span className="ml-1">{config.label}</span>
      </Badge>
      {refundConfig && status !== 'rejected' && (
        <Badge variant="outline" className={`${refundConfig.color} border text-xs`}>
          {refundConfig.icon}
          <span className="ml-1">{refundConfig.label}</span>
        </Badge>
      )}
    </div>
  );
}
