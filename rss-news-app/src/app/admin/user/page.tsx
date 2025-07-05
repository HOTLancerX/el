import Link from "next/link";
import { IUser } from "@/models/User";
import UserListClient from "./UserListClient"; // We'll create this client component

async function getUsers(): Promise<IUser[]> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/admin/users`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Failed to fetch users: ${res.status} ${await res.text()}`);
      throw new Error("Failed to fetch users");
    }
    const data = await res.json();
    return data.data as IUser[];
  } catch (error) {
    console.error("Error in getUsers function:", error);
    return [];
  }
}

export default async function AdminUserListPage() {
  const users = await getUsers();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Users</h1>
        <Link
          href="/admin/user/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add New User
        </Link>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-600">No users found. <Link href="/admin/user/add" className="text-indigo-600 hover:underline">Add one now</Link>.</p>
      ) : (
        <UserListClient users={users} />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
