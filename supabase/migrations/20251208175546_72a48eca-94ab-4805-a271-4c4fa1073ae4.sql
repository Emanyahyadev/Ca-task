-- Allow Admin to delete clients
CREATE POLICY "Admin can delete clients"
  ON public.clients FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow Admin to delete employees  
CREATE POLICY "Admin can delete employees"
  ON public.employees FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow Admin/Manager to delete tasks
CREATE POLICY "Admin/Manager can delete tasks"
  ON public.tasks FOR DELETE
  USING (public.is_admin_or_manager(auth.uid()));

-- Allow Admin/Manager to delete documents
CREATE POLICY "Admin/Manager can delete documents"
  ON public.documents FOR DELETE
  USING (public.is_admin_or_manager(auth.uid()));