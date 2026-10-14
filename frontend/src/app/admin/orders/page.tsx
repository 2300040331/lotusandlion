'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/useAdminData';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import { Search, Eye, Filter, Download } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Modal from '@/components/admin/Modal';
import { formatINR } from '@/lib/currency';

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, loading, refresh } = useOrders(`?search=${search}&status=${status}`);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      toast.success('Order status updated');
      refresh();
      if (selectedOrder?.id === id) {
        const { data: updated } = await api.get(`/admin/orders/${id}`);
        setSelectedOrder(updated);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const exportCsv = () => {
    const orders = data?.orders || [];
    if (orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    const headers: string[] = ['Order ID', 'Customer', 'Email', 'Date', 'Status', 'Paid', 'Delivered', 'Total'];
    const rows: string[][] = orders.map((order: any) => [
      order.id,
      order.user?.name || '',
      order.user?.email || '',
      new Date(order.createdAt).toISOString(),
      order.status || '',
      order.isPaid ? 'Yes' : 'No',
      order.isDelivered ? 'Yes' : 'No',
      formatINR(order.totalPrice) || '₹0.00',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lotus-lion-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Order CSV exported');
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: (item: any) => (
        <span className="text-[10px] font-mono text-gray-500">#{item.id.slice(-8)}</span>
      ),
    },
    {
      header: 'Customer',
      accessor: (item: any) => (
        <div>
          <p className="text-[10px] font-bold uppercase text-white">{item.user?.name}</p>
          <p className="text-[8px] text-gray-500">{item.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: (item: any) => (
        <p className="text-[10px] text-gray-400 font-bold uppercase">
          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      ),
    },
    {
      header: 'Total',
      accessor: (item: any) => (
        <p className="text-xs font-bold text-primary">{formatINR(item.totalPrice)}</p>
      ),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <OrderStatusBadge isPaid={item.isPaid} isDelivered={item.isDelivered} status={item.status} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (item: any) => (
        <button 
          onClick={() => setSelectedOrder(item)}
          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          <Eye size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminHeader title="Order Ledger" subtitle="Manage your global transaction history." />
        <button
          onClick={exportCsv}
          className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all h-fit"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Customer Email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#111] border border-white/5 rounded-xl py-3 pl-10 pr-10 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-primary/50 appearance-none text-gray-400"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.orders || []} 
        loading={loading} 
        onRowClick={(item) => setSelectedOrder(item)}
      />

      {/* Order Detail Modal */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title={`Order Details #${selectedOrder?.id.slice(-8)}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Customer Info</h3>
                <p className="text-sm font-bold text-white uppercase">{selectedOrder.user?.name}</p>
                <p className="text-xs text-gray-400">{selectedOrder.user?.email}</p>
              </div>
              <div>
                <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Shipping Address</h3>
                <p className="text-xs text-gray-400">
                  {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}<br />
                  {selectedOrder.shippingAddress.postalCode}, {selectedOrder.shippingAddress.country}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.orderItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <img src={item.image} alt="" className="w-12 h-20 object-contain rounded bg-white/5" />
                    <div className="flex-grow">
                      <p className="text-[10px] font-bold uppercase text-white">{item.name}</p>
                      <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Qty: {item.qty} | Size: {item.size || 'N/A'}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatINR(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 flex justify-between items-end">
              <div className="space-y-2">
                <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Change Status</h3>
                <div className="flex gap-2">
                  {['pending', 'paid', 'shipped', 'delivered'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        selectedOrder.status === s 
                          ? 'admin-btn-primary bg-[#573B2D] text-[#FEFFEF] shadow-sm' 
                          : 'bg-white border border-[#573B2D]/20 text-[#573B2D] hover:bg-[#573B2D]/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-primary">{formatINR(selectedOrder.totalPrice)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
