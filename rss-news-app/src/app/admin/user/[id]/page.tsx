import UserForm from "@/components/admin/UserForm";
import { IUser } from "@/models/User";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getUser(id: string): Promise<IUser | null> {
  try {
    // Ensure NEXT_PUBLIC_APP_URL is set in your .env.local for development
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/admin/users/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`Failed to fetch user ${id}: ${res.status} ${await res.text()}`);
      throw new Error("Failed to fetch user data");
    }
    const data = await res.json();
    return data.data as IUser;
  } catch (error) {
    console.error("Error in getUser function:", error);
    return null;
  }
}

export default async function AdminEditUserPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }

  const user = await getUser(params.id);

  if (!user) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Edit User: {user.name}</h1>
        <Link href="/admin/user" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Users
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <UserForm initialData={user} isEditMode={true} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
