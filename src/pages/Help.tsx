import React from 'react';
import { User } from '@/types';
import { Card } from '@/components/ca/ui';

const Help: React.FC<{ user: User }> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'manager';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900">How to use this App</h2>

      {(isAdmin || isManager) ? (
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2">For Admin / Manager</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              <strong>Managing Clients:</strong> Go to the <em>Clients</em> page to add new businesses. You can edit their contact details and check their status (Active/Inactive) anytime.
            </li>
            <li>
              <strong>Assigning Work:</strong> Go to the <em>All Tasks</em> page. Click "Create Task", select a Client, and choose an Employee from the "Assign To" dropdown. Set a due date so they know when it's urgent.
            </li>
            <li>
              <strong>Tracking Progress:</strong> On the Dashboard, you can see how many tasks are overdue. Click on any task to see if files have been uploaded by your staff.
            </li>
            <li>
              <strong>Documents:</strong> You can upload documents inside any Task detail page. These are visible to the staff assigned to that work.
            </li>
            {isAdmin && (
              <li>
                <strong>Managing Employees:</strong> Go to the <em>Employees</em> page to add new staff members. You can activate or deactivate their accounts.
              </li>
            )}
          </ul>
        </Card>
      ) : (
        <Card className="space-y-4">
          <h3 className="text-lg font-bold text-green-800 border-b pb-2">For Staff</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              <strong>Your Work:</strong> Click on <em>My Tasks</em> in the sidebar. This list shows only the work assigned specifically to you.
            </li>
            <li>
              <strong>Starting a Task:</strong> Click on a task title. Change the status from "Not started" to "In progress" so the CA knows you are working on it.
            </li>
            <li>
              <strong>Uploading Files:</strong> Inside a Task, look for the "Documents" box. Click "Upload File" to attach Excel sheets, PDFs, or working papers.
            </li>
            <li>
              <strong>Completing Work:</strong> When you are done, change the status to "Completed".
            </li>
          </ul>
        </Card>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Need technical support? Contact the system administrator.</p>
        <p>Version 1.0.0</p>
      </div>
    </div>
  );
};

export default Help;
