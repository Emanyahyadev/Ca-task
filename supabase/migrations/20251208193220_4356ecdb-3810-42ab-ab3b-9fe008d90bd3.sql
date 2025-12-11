-- Drop admin-only policies and replace with admin/manager policies

-- Clients: Allow managers to delete clients (currently admin-only)
DROP POLICY IF EXISTS "Admin can delete clients" ON public.clients;
CREATE POLICY "Admin/Manager can delete clients" 
ON public.clients 
FOR DELETE 
USING (is_admin_or_manager(auth.uid()));

-- Employees: Allow managers to manage employees (currently admin-only)
DROP POLICY IF EXISTS "Admin can create employees" ON public.employees;
CREATE POLICY "Admin/Manager can create employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Admin can update employees" ON public.employees;
CREATE POLICY "Admin/Manager can update employees" 
ON public.employees 
FOR UPDATE 
USING (is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete employees" ON public.employees;
CREATE POLICY "Admin/Manager can delete employees" 
ON public.employees 
FOR DELETE 
USING (is_admin_or_manager(auth.uid()));

-- User roles: Allow managers to manage roles (currently admin-only)
DROP POLICY IF EXISTS "Only admin can insert roles" ON public.user_roles;
CREATE POLICY "Admin/Manager can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Only admin can update roles" ON public.user_roles;
CREATE POLICY "Admin/Manager can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_admin_or_manager(auth.uid()));