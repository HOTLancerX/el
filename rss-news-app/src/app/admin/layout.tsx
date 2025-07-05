"use client"; // Admin layout can be client component for state like sidebar toggle

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useState } from "react";
// import { Menu, X } from "lucide-react"; // For icons

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en" className="h-full bg-gray-100">
      <body className="h-full">
        <div className="flex min-h-screen">
          {/* Mobile sidebar toggle */}
          <div className="md:hidden fixed top-0 left-0 z-50 p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-700 hover:text-indigo-600 p-2 rounded-md bg-white shadow"
              aria-label="Toggle sidebar"
            >
              {/* Placeholder for Menu/X icon */}
              {isSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )}
            </button>
          </div>

          {/* Sidebar */}
          {/* Always render sidebar for slide-in/out, control visibility with translate */}
          <div className={`fixed inset-y-0 left-0 z-40 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:block transition-transform duration-300 ease-in-out`}>
            <AdminSidebar />
          </div>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
             {/* Optional: Simple Admin Header for current section title or user menu */}
            {/* <div className="bg-white shadow rounded-lg p-4 mb-6 hidden md:block">
              <h1 className="text-xl font-semibold text-gray-700">Admin Dashboard</h1>
            </div> */}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
