import CategoryForm from "@/components/admin/CategoryForm";
import { ICategory } from "@/models/Category";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getCategory(id: string): Promise<ICategory | null> {
  // In a real app, you'd fetch from your API or directly from DB
  // For now, this is a placeholder. We'll need to build the actual API endpoint.
  // Ensure this fetch is aligned with your API structure.
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/categories/${id}`, {
      cache: "no-store", // Ensure fresh data for editing
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch category");
    }
    const data = await res.json();
    return data.data as ICategory;
  } catch (error) {
    console.error("Error fetching category for edit:", error);
    return null;
  }
}

export default async function AdminEditCategoryPage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }

  const category = await getCategory(params.id);

  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Edit Category: {category.title}</h1>
        <Link href="/admin/category" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Categories
        </Link>
      </div>
      <CategoryForm initialData={category} isEditMode={true} />
    </div>
  );
}

// Opt out of static generation for this page as it's dynamic
export const dynamic = "force-dynamic";
