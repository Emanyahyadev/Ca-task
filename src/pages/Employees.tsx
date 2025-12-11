import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Employee } from '@/types';
import { getEmployees, updateEmployee, deleteEmployee } from '@/services/api';
import { Card, Button, Input, Modal, Label, Badge } from '@/components/ca/ui';
import { UserPlus, UserX, UserCheck, Trash2 } from 'lucide-react';
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

const Employees: React.FC<{ user: User }> = ({ user }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState<{ full_name: string; email: string; phone: string; designation: string; employee_id: string }>({
    full_name: '',
    email: '',
    phone: '',
    designation: '',
    employee_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();

    const channel = supabase
      .channel('employees-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        () => loadEmployees()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.full_name || !newEmp.email || !newEmp.employee_id) return;

    if (newEmp.employee_id.length < 6) {
      toast({ title: 'Error', description: 'Employee ID must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // 1. Create a temporary client to sign up the new user WITHOUT logging out the admin
      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: false, // Don't overlook this! Prevents overwriting local admin session
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      // 2. Sign up the new user
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newEmp.email,
        password: newEmp.employee_id,
        options: {
          data: { full_name: newEmp.full_name }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // 3. Create employee record (using the MAIN client which has Admin privileges)
      const { error: empError } = await supabase
        .from('employees')
        .insert({
          user_id: authData.user.id,
          full_name: newEmp.full_name,
          email: newEmp.email,
          phone: newEmp.phone || null,
          designation: newEmp.designation || 'Staff',
          employee_id: newEmp.employee_id
        });

      if (empError) throw empError;

      setIsModalOpen(false);
      setNewEmp({ full_name: '', email: '', phone: '', designation: '', employee_id: '' });
      toast({
        title: 'Employee Created!',
        description: `Login: ${newEmp.email} | Password: ${newEmp.employee_id}`
      });
      loadEmployees(); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (emp: Employee) => {
    try {
      await updateEmployee({ ...emp, active: !emp.active });
      toast({ title: 'Success', description: `Employee ${emp.active ? 'deactivated' : 'activated'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEmployee(deleteId);
      toast({ title: 'Success', description: 'Employee deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const isAdminOrManager = user.role === 'admin' || user.role === 'manager';
  if (!isAdminOrManager) return <div>Access Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <UserPlus size={16} /> Add Employee
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 border-b">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Designation</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{emp.full_name}</td>
                <td className="px-6 py-3">{emp.email}</td>
                <td className="px-6 py-3">{emp.designation}</td>
                <td className="px-6 py-3">{emp.phone}</td>
                <td className="px-6 py-3">
                  <Badge color={emp.active ? 'green' : 'gray'}>{emp.active ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(emp)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${emp.active ? 'text-red-700 bg-red-50 border-red-200' : 'text-green-700 bg-green-50 border-green-200'}`}
                    >
                      {emp.active ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                    </button>
                    <button
                      onClick={() => setDeleteId(emp.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded border text-red-700 bg-red-50 border-red-200 hover:bg-red-100"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length === 0 && (
          <div className="p-8 text-center text-gray-500">No employees found.</div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={newEmp.full_name} onChange={e => setNewEmp({ ...newEmp, full_name: e.target.value })} required />
          </div>
          <div>
            <Label>Email (Login ID) *</Label>
            <Input type="email" value={newEmp.email} onChange={e => setNewEmp({ ...newEmp, email: e.target.value })} required />
          </div>
          <div>
            <Label>Employee ID (Used as Password) *</Label>
            <Input
              value={newEmp.employee_id}
              onChange={e => setNewEmp({ ...newEmp, employee_id: e.target.value })}
              required
              minLength={6}
              placeholder="e.g. EMP001 (min 6 characters)"
            />
            <p className="text-xs text-gray-500 mt-1">This ID will be used as the employee's login password</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })} />
            </div>
            <div>
              <Label>Designation</Label>
              <Input value={newEmp.designation} onChange={e => setNewEmp({ ...newEmp, designation: e.target.value })} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
          </div>
        </form>
      </Modal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee from the database.
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

export default Employees;