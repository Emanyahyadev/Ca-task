import React, { useState, useEffect } from 'react';
import { User, Client } from '@/types';
import { getClients, saveClient, deleteClient } from '@/services/api';
import { Card, Button, Input, Modal, Label, Badge } from '@/components/ca/ui';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Clients: React.FC<{ user: User }> = ({ user }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client>>({});
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();

    const channel = supabase
      .channel('clients-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => loadClients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient.name || !editingClient.client_code) return;

    setLoading(true);
    try {
      await saveClient(editingClient);
      setIsModalOpen(false);
      setEditingClient({});
      toast({ title: 'Success', description: 'Client saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteClient(deleteId);
      toast({ title: 'Success', description: 'Client deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const openNew = () => {
    setEditingClient({});
    setIsModalOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_code.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = user.role === 'admin';
  const isAdminOrManager = isAdmin || user.role === 'manager';

  if (!isAdminOrManager) return <div>Access Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
        {isAdminOrManager && (
          <Button onClick={openNew} className="flex items-center gap-2">
            <Plus size={16} /> Add Client
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white p-2 rounded-md border border-gray-300 w-full max-w-sm">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or code..."
          className="flex-1 outline-none text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Contact Person</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Status</th>
                {isAdminOrManager && <th className="px-6 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs">{client.client_code}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-3">{client.contact_person}</td>
                  <td className="px-6 py-3">{client.contact_phone}</td>
                  <td className="px-6 py-3">
                    <Badge color={client.status === 'Active' ? 'green' : 'red'}>{client.status}</Badge>
                  </td>
                  {isAdminOrManager && (
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(client)} className="text-blue-600 hover:text-blue-800">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setDeleteId(client.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="p-8 text-center text-gray-500">No clients found matching your search.</div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient.id ? 'Edit Client' : 'New Client'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client Name *</Label>
              <Input value={editingClient.name || ''} onChange={e => setEditingClient({...editingClient, name: e.target.value})} required />
            </div>
            <div>
              <Label>Code (Short) *</Label>
              <Input value={editingClient.client_code || ''} onChange={e => setEditingClient({...editingClient, client_code: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact Person</Label>
              <Input value={editingClient.contact_person || ''} onChange={e => setEditingClient({...editingClient, contact_person: e.target.value})} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editingClient.contact_phone || ''} onChange={e => setEditingClient({...editingClient, contact_phone: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={editingClient.contact_email || ''} onChange={e => setEditingClient({...editingClient, contact_email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>PAN</Label>
              <Input value={editingClient.pan_number || ''} onChange={e => setEditingClient({...editingClient, pan_number: e.target.value})} />
            </div>
            <div>
              <Label>GSTIN</Label>
              <Input value={editingClient.gst_number || ''} onChange={e => setEditingClient({...editingClient, gst_number: e.target.value})} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={editingClient.status || 'Active'}
              onChange={e => setEditingClient({...editingClient, status: e.target.value as 'Active' | 'Inactive'})}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Client'}</Button>
          </div>
        </form>
      </Modal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;