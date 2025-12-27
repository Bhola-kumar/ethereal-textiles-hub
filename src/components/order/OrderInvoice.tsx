import { useRef } from 'react';
import { format } from 'date-fns';
import { Download, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string | null;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  full_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

interface InvoiceOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost?: number | null;
  discount?: number | null;
  total: number;
  shipping_address: ShippingAddress;
  notes?: string | null;
  tracking_id?: string | null;
  order_items?: OrderItem[];
  items?: OrderItem[];
}

interface ShopInfo {
  shop_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
}

interface OrderInvoiceProps {
  order: InvoiceOrder;
  shopInfo?: ShopInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderInvoice({ order, shopInfo, open, onOpenChange }: OrderInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const items = order.order_items || order.items || [];
  const address = order.shipping_address || {};
  
  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5; }
            .invoice-title { font-size: 28px; font-weight: bold; color: #1a1a1a; }
            .invoice-number { font-size: 14px; color: #666; margin-top: 4px; }
            .invoice-date { font-size: 14px; color: #666; text-align: right; }
            .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .address-block h3 { font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .address-block p { font-size: 14px; line-height: 1.6; color: #333; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { text-align: left; font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 0; border-bottom: 2px solid #e5e5e5; }
            .items-table td { padding: 16px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
            .items-table .qty, .items-table .price, .items-table .total { text-align: right; }
            .items-table .product { max-width: 300px; }
            .summary { margin-left: auto; width: 280px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .summary-row.total { border-top: 2px solid #1a1a1a; margin-top: 8px; padding-top: 16px; font-size: 18px; font-weight: bold; }
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #888; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .gst-info { margin-top: 8px; font-size: 12px; color: #666; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    handlePrint();
  };

  const getStatusClass = (status: string) => {
    if (status === 'paid' || status === 'delivered') return 'status-paid';
    return 'status-pending';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>Invoice</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={invoiceRef} className="p-6 bg-white text-gray-900 rounded-lg">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-sm text-gray-600 mt-1">#{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {format(new Date(order.created_at), 'PPP')}
              </p>
              <div className="mt-2 flex gap-2 justify-end">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.payment_status.toUpperCase()}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.status.toUpperCase().replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Seller Info */}
            {shopInfo && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">From</h3>
                <p className="text-sm text-gray-800 leading-relaxed">
                  <strong>{shopInfo.shop_name}</strong><br />
                  {shopInfo.address && <>{shopInfo.address}<br /></>}
                  {shopInfo.city && shopInfo.state && (
                    <>{shopInfo.city}, {shopInfo.state} {shopInfo.pincode}<br /></>
                  )}
                  {shopInfo.phone && <>Phone: {shopInfo.phone}<br /></>}
                  {shopInfo.email && <>Email: {shopInfo.email}<br /></>}
                  {shopInfo.gst_number && (
                    <span className="text-xs text-gray-500">GSTIN: {shopInfo.gst_number}</span>
                  )}
                </p>
              </div>
            )}
            
            {/* Customer Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bill To</h3>
              <p className="text-sm text-gray-800 leading-relaxed">
                <strong>{address.full_name || 'Customer'}</strong><br />
                {address.address_line1 && <>{address.address_line1}<br /></>}
                {address.address_line2 && <>{address.address_line2}<br /></>}
                {address.city && address.state && (
                  <>{address.city}, {address.state} {address.pincode}<br /></>
                )}
                {address.phone && <>Phone: {address.phone}</>}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">Product</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">Qty</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">Price</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4 text-sm text-gray-800">{item.product_name}</td>
                  <td className="py-4 text-sm text-gray-800 text-right">{item.quantity}</td>
                  <td className="py-4 text-sm text-gray-800 text-right">₹{Number(item.price).toLocaleString()}</td>
                  <td className="py-4 text-sm text-gray-900 font-medium text-right">
                    ₹{(item.quantity * Number(item.price)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="ml-auto w-72">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-800">₹{Number(order.subtotal).toLocaleString()}</span>
            </div>
            {order.shipping_cost && Number(order.shipping_cost) > 0 && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-800">₹{Number(order.shipping_cost).toLocaleString()}</span>
              </div>
            )}
            {order.discount && Number(order.discount) > 0 && (
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-green-600">-₹{Number(order.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-3 mt-2 border-t-2 border-gray-900">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">₹{Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Additional Info */}
          {order.tracking_id && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Tracking ID:</strong> {order.tracking_id}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Thank you for your order! For any queries, please contact support.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
