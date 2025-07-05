"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// Import icons from a library like lucide-react or heroicons
// For now, using simple text/emoji placeholders for icons
// npm install lucide-react
// import { LayoutDashboard, Tags, Rss, Users, Newspaper } from "lucide-react";

const navItems = [
  { name: "Dashboard (Posts)", href: "/admin", icon: "📰" /* Newspaper */, current: false },
  { name: "Categories", href: "/admin/category", icon: "🏷️" /* Tags */, current: false },
  { name: "RSS Feeds", href: "/admin/feed", icon: "📡" /* Rss */, current: false },
  { name: "Users", href: "/admin/user", icon: "👥" /* Users */, current: false },
  // Add more items as needed
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 text-gray-100 min-h-screen p-4 space-y-2 fixed top-0 left-0 h-full overflow-y-auto md:relative md:translate-x-0 transition-transform duration-300 ease-in-out">
      <div className="text-2xl font-semibold text-white p-3 mb-4 border-b border-gray-700">
        Admin Panel
      </div>
      <nav>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }
                transition-colors duration-150`}
            >
              {/* Example with placeholder icon */}
              <span className="w-6 h-6 flex items-center justify-center">{item.icon}</span>
              {/* <item.icon className="h-5 w-5" /> Using lucide icons */}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
       <div className="pt-4 mt-4 border-t border-gray-700">
         <Link
            href="/"
            target="_blank" // Open public site in new tab
            className="flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150"
        >
            <span className="w-6 h-6 flex items-center justify-center">🌍</span>
            <span>View Public Site</span>
        </Link>
       </div>
    </aside>
  );
}
