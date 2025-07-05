import UserForm from "@/components/admin/UserForm";
import Link from "next/link";

export default function AdminAddUserPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Add New User</h1>
        <Link href="/admin/user" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Users
        </Link>
      </div>
      <div className="max-w-2xl mx-auto">
        <UserForm />
      </div>
    </div>
  );
}
