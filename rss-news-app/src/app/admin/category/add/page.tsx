import CategoryForm from "@/components/admin/CategoryForm";
import Link from "next/link";

export default function AdminAddCategoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Add New Category</h1>
        <Link href="/admin/category" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Categories
        </Link>
      </div>
      <CategoryForm />
    </div>
  );
}
