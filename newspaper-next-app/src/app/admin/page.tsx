'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // This page should ideally be protected by middleware,
  // but as a fallback, redirect if not authenticated.
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading session...</p></div>;
  }

  if (status === 'unauthenticated' || !session) {
    // This should ideally not be reached if middleware is effective
    return <div className="min-h-screen flex items-center justify-center"><p>Redirecting to sign in...</p></div>;
  }

  // At this point, user is authenticated
  // Check for admin role if needed for specific content
  // if (session.user?.role !== 'admin') {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
  //       <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
  //       <p className="mb-6">You do not have permission to view this page.</p>
  //       <Link href="/" className="text-indigo-600 hover:text-indigo-800">Go to Homepage</Link>
  //     </div>
  //   );
  // }


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Navbar Placeholder */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 font-bold text-xl text-indigo-600">
                Admin Panel
              </div>
            </div>
            <div className="flex items-center">
               <span className="text-sm text-gray-700 mr-4">Welcome, {session.user?.name || session.user?.email} ({session.user?.role})</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })} // Redirect to homepage after sign out
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <div className="py-4">
              <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
                <p className="text-gray-700">Welcome to the admin dashboard!</p>
                <p className="text-gray-700 mt-2">Session status: {status}</p>
                {session?.user && (
                  <div className="mt-4 p-4 bg-gray-50 rounded shadow">
                    <h2 className="font-semibold text-lg">User Information:</h2>
                    <p>Name: {session.user.name}</p>
                    <p>Email: {session.user.email}</p>
                    <p>Role: {session.user.role}</p>
                    {/* <p>Expires: {session.expires}</p> */}
                  </div>
                )}
                 <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Management Links</h2>
                    <ul className="space-y-2">
                        <li><Link href="/admin/users" className="text-indigo-600 hover:text-indigo-800">Manage Users</Link></li>
                        {/* Add more links as features are built */}
                        {/* <li><Link href="/admin/articles" className="text-indigo-600 hover:text-indigo-800">Manage Articles</Link></li> */}
                        {/* <li><Link href="/admin/categories" className="text-indigo-600 hover:text-indigo-800">Manage Categories</Link></li> */}
                    </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
