-- Drop existing restrictive policies for clients
DROP POLICY IF EXISTS "Admin can create clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can update clients" ON public.clients;

-- Create new policies allowing managers to create/update clients
CREATE POLICY "Admin/Manager can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can update clients"
  ON public.clients FOR UPDATE
  USING (public.is_admin_or_manager(auth.uid()));

-- Drop existing restrictive policies for tasks
DROP POLICY IF EXISTS "Admin can create tasks" ON public.tasks;

-- Create new policy allowing managers to create tasks
CREATE POLICY "Admin/Manager can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_admin_or_manager(auth.uid()));