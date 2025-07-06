'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // To ensure only admins can see this, though middleware handles route access

// Define a simple User type for now
interface User {
  _id: string;
  name?: string | null;
  email?: string | null;
  role: 'admin' | 'editor' | 'author' | 'user';
  createdAt: string; // Assuming timestamps are present
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: When API is implemented, this will fetch actual users
        // For now, it will hit the placeholder and might show an error or empty state
        const response = await fetch('/api/users');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch users: ${response.statusText}`);
        }
        const data = await response.json();
        // If the API returns a simple message for 'Not Implemented', data might not be an array
        if (Array.isArray(data)) {
            setUsers(data);
        } else if (data.message && data.message.includes('Not Implemented')) {
            console.warn('API /api/users is not fully implemented yet.');
            setUsers([]); // Set to empty array for now
        } else {
            setUsers(data.users || []); // Fallback if structure is { users: [] }
        }

      } catch (err: any) {
        setError(err.message);
        setUsers([]); // Clear users on error
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch users only if the user is an admin (additional client-side check)
    // Middleware should primarily handle route access control.
    if (session?.user?.role === 'admin') {
      fetchUsers();
    } else if (session) {
        setError('You do not have permission to view this page.');
        setIsLoading(false);
    }
  }, [session]);

  // This page should be protected by middleware.
  // Only admins should ideally reach this far.
  if (session?.user?.role !== 'admin' && !isLoading) {
     return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
            <p className="text-gray-700 mt-2">You do not have the necessary permissions to manage users.</p>
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
              &larr; Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          {/* <Link href="/admin/users/new" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Add New User
          </Link> */}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoading && <p className="p-4 text-gray-600">Loading users...</p>}
          {error && <p className="p-4 text-red-600">Error: {error}</p>}
          {!isLoading && !error && users.length === 0 && (
            <p className="p-4 text-gray-600">No users found. (Or API not yet implemented fully)</p>
          )}
          {!isLoading && !error && users.length > 0 && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* Placeholder for actions like Edit, Delete */}
                      <a href="#" className="text-indigo-600 hover:text-indigo-900 mr-3">View</a>
                      {/* <a href="#" className="text-red-600 hover:text-red-900">Delete</a> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
         <div className="mt-6">
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-800">
              &larr; Back to Admin Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
}
