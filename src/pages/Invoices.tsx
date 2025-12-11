import React, { useState, useEffect } from 'react';
import { Card, Modal, Input, Select, Button, Label } from '@/components/ca/ui';
import { User, Invoice, Client, Task, InvoiceStatus } from '@/types';
import { FileText, DollarSign, Clock, CheckCircle, Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { getInvoices, saveInvoice, deleteInvoice, getInvoiceStats, getClients, getTasks, savePayment } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface InvoicesProps {
  user: User;
}

const statusColors: Record<InvoiceStatus, string> = {
  'Draft': 'bg-gray-100 text-gray-700',
  'Sent': 'bg-blue-100 text-blue-700',
  'Paid': 'bg-green-100 text-green-700',
  'Overdue': 'bg-red-100 text-red-700',
  'Cancelled': 'bg-gray-200 text-gray-500'
};

const Invoices: React.FC<InvoicesProps> = ({ user }) => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ totalInvoices: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    task_id: '',
    amount: '',
    description: '',
    due_date: '',
    notes: '',
    status: 'Draft' as InvoiceStatus
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: '',
    reference_number: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [invoicesData, clientsData, tasksData, statsData] = await Promise.all([
        getInvoices(),
        getClients(),
        getTasks(user),
        getInvoiceStats()
      ]);
      setInvoices(invoicesData);
      setClients(clientsData);
      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${date}-${random}`;
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      task_id: '',
      amount: '',
      description: '',
      due_date: '',
      notes: '',
      status: 'Draft'
    });
    setEditingInvoice(null);
  };

  const handleOpenModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        client_id: invoice.client_id || '',
        task_id: invoice.task_id || '',
        amount: invoice.amount.toString(),
        description: invoice.description || '',
        due_date: invoice.due_date,
        notes: invoice.notes || '',
        status: invoice.status
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSaveInvoice = async () => {
    if (!formData.client_id || !formData.amount || !formData.due_date) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    try {
      await saveInvoice({
        id: editingInvoice?.id,
        invoice_number: editingInvoice?.invoice_number || generateInvoiceNumber(),
        client_id: formData.client_id,
        task_id: formData.task_id || null,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        due_date: formData.due_date,
        notes: formData.notes || null,
        status: formData.status,
        issue_date: editingInvoice?.issue_date || format(new Date(), 'yyyy-MM-dd'),
        created_by: user.id
      });
      toast({ title: 'Success', description: editingInvoice ? 'Invoice updated' : 'Invoice created' });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(id);
      toast({ title: 'Success', description: 'Invoice deleted' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPaymentData({
      amount: invoice.amount.toString(),
      payment_method: '',
      reference_number: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async () => {
    if (!payingInvoice || !paymentData.amount) return;

    try {
      await savePayment({
        invoice_id: payingInvoice.id,
        amount: parseFloat(paymentData.amount),
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        payment_method: paymentData.payment_method || null,
        reference_number: paymentData.reference_number || null,
        notes: paymentData.notes || null,
        created_by: user.id
      });

      await saveInvoice({
        id: payingInvoice.id,
        status: 'Paid',
        paid_date: format(new Date(), 'yyyy-MM-dd')
      });

      toast({ title: 'Success', description: 'Payment recorded' });
      setShowPaymentModal(false);
      setPayingInvoice(null);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'N/A';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const filteredTasks = tasks.filter(t => !formData.client_id || t.client_id === formData.client_id);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices & Payments</h1>
          <p className="text-gray-500 mt-1">Manage billing and payment records</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Invoices</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalInvoices}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.totalPending.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-gray-900">₹{stats.totalOverdue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice List */}
      <Card className="overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
            <p className="text-gray-500">Click "Create Invoice" to add your first invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Invoice #</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Issue Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Due Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getClientName(invoice.client_id)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{invoice.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(invoice.issue_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(invoice.due_date), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(invoice)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {invoice.status !== 'Paid' && (
                          <button onClick={() => handleMarkAsPaid(invoice)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteInvoice(invoice.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Invoice Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'}>
        <div className="space-y-4">
          <div>
            <Label>Client *</Label>
            <Select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value, task_id: '' })}
              options={[{ value: '', label: 'Select Client' }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div>
            <Label>Task (Optional)</Label>
            <Select
              value={formData.task_id}
              onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
              options={[{ value: '', label: 'No Task' }, ...filteredTasks.map(t => ({ value: t.id, label: t.title }))]}
            />
          </div>
          <div>
            <Label>Amount (₹) *</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
            />
          </div>
          <div>
            <Label>Due Date *</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Invoice description"
            />
          </div>
          {editingInvoice && (
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                options={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Sent', label: 'Sent' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Overdue', label: 'Overdue' },
                  { value: 'Cancelled', label: 'Cancelled' }
                ]}
              />
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSaveInvoice}>{editingInvoice ? 'Update' : 'Create'} Invoice</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPayingInvoice(null); }} title="Record Payment">
        <div className="space-y-4">
          <div>
            <Label>Payment Amount (₹) *</Label>
            <Input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Input
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
              placeholder="e.g., Bank Transfer, UPI, Cash"
            />
          </div>
          <div>
            <Label>Reference Number</Label>
            <Input
              value={paymentData.reference_number}
              onChange={(e) => setPaymentData({ ...paymentData, reference_number: e.target.value })}
              placeholder="Transaction reference"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              placeholder="Payment notes"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => { setShowPaymentModal(false); setPayingInvoice(null); }}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
