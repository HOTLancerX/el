"use client";

import { IUser } from "@/models/User";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserListClientProps {
  users: IUser[];
}

export default function UserListClient({ users: initialUsers }: UserListClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<IUser[]>(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // ID of user being processed

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    setIsProcessing(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete user");
      }
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
      // router.refresh(); // Refresh data from server if needed, or rely on state
    } catch (err: any) {
      console.error("Delete error:", err);
      setError(err.message || "An error occurred while deleting.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleActive = async (user: IUser) => {
    setIsProcessing(user._id as string);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update user status");
      }
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
      // router.refresh();
    } catch (err: any) {
      console.error("Toggle active error:", err);
      setError(err.message);
    } finally {
      setIsProcessing(null);
    }
  };

  if (users.length === 0 && initialUsers.length > 0) {
    return <p className="text-gray-600">All users have been deleted.</p>;
  }
   if (initialUsers.length === 0) {
    return <p className="text-gray-600">No users found.</p>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user._id as string}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleToggleActive(user)}
                  disabled={isProcessing === (user._id as string)}
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  } ${isProcessing === (user._id as string) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing === (user._id as string) ? "..." : (user.isActive ? "Active" : "Inactive")}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.createdAt!).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link href={`/admin/user/${user._id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(user._id as string)}
                  disabled={isProcessing === (user._id as string)}
                  className={`text-red-600 hover:text-red-900 ${isProcessing === (user._id as string) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing === (user._id as string) ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
