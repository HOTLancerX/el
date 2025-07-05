"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ICategory } from "@/models/Category"; // Assuming you might want to list categories

export default function PublicHeader() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Basic fetch for categories to display in nav - could be improved with SSR
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories"); // Or a dedicated public categories API
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setCategories(data.data.slice(0, 7)); // Show a few categories
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories for header", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Site Name */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
              NewsHub
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            <Link
              href="/"
              className={`text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium ${
                pathname === "/" ? "text-indigo-600 bg-indigo-50" : ""
              }`}
            >
              Home
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat._id as string}
                href={`/category/${cat._id}`}
                className={`text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === `/category/${cat._id}` ? "text-indigo-600 bg-indigo-50" : ""
                }`}
              >
                {cat.title}
              </Link>
            ))}
             <Link
              href="/admin" // Link to Admin Panel
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 ml-4"
              target="_blank" // Open in new tab as it's a different section
            >
              Admin Panel
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-indigo-600 focus:outline-none focus:text-indigo-600"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white shadow-lg z-30 pb-4">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/" ? "text-indigo-600 bg-indigo-50" : ""
              }`}
            >
              Home
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat._id as string}
                href={`/category/${cat._id}`}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-md text-base font-medium ${
                  pathname === `/category/${cat._id}` ? "text-indigo-600 bg-indigo-50" : ""
                }`}
              >
                {cat.title}
              </Link>
            ))}
             <Link
              href="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="block text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-md text-base font-medium"
              target="_blank"
            >
              Admin Panel
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
