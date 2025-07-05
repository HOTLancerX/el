"use client";

import { IUser } from "@/models/User";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";

interface UserFormProps {
  initialData?: IUser | null;
  isEditMode?: boolean;
}

export default function UserForm({ initialData, isEditMode = false }: UserFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    password: "", // Password field is always empty initially for security
    confirmPassword: "", // For new user creation or password change
    isActive: initialData?.isActive === undefined ? true : initialData.isActive,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        password: "",
        confirmPassword: "",
        isActive: initialData.isActive === undefined ? true : initialData.isActive,
      });
    }
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.name || !formData.email) {
      setError("Name and Email are required.");
      setIsLoading(false);
      return;
    }

    if (!isEditMode && !formData.password) {
      setError("Password is required for new users.");
      setIsLoading(false);
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = isEditMode ? `/api/admin/users/${initialData?._id}` : "/api/admin/users";
      const method = isEditMode ? "PUT" : "POST";

      const payload: any = {
        name: formData.name,
        email: formData.email,
        isActive: formData.isActive,
      };

      if (formData.password) { // Only include password if it's being set/changed
        payload.password = formData.password;
      }

      const response = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        let errorMessage = result.error || `Failed to ${isEditMode ? 'update' : 'create'} user`;
        if (result.errors) { // Handle validation errors from API
          errorMessage = Object.values(result.errors).join(', ');
        }
        throw new Error(errorMessage);
      }

      setSuccessMessage(`User ${isEditMode ? 'updated' : 'created'} successfully!`);
      router.refresh(); // Refresh server components to show new data

      if (isEditMode) {
        // Optionally, clear password fields after successful update
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        setTimeout(() => router.push("/admin/user"), 1500);
      } else {
        // Reset form for adding another user
        setFormData({ name: "", email: "", password: "", confirmPassword: "", isActive: true });
      }

    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white shadow-md rounded-lg">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {successMessage && <div className="p-3 bg-green-100 text-green-700 rounded-md">{successMessage}</div>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password {isEditMode ? "(Leave blank to keep current)" : <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password {formData.password && <span className="text-red-500">*</span>}
        </label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="flex items-center">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
          Active (User can login)
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (isEditMode ? "Updating User..." : "Creating User...") : (isEditMode ? "Update User" : "Create User")}
        </button>
      </div>
      {isEditMode && (
        <button
            type="button"
            onClick={() => router.push('/admin/user')}
            className="mt-2 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
            Cancel
        </button>
      )}
    </form>
  );
}
