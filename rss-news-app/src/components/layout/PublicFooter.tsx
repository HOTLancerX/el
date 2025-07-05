export default function PublicFooter() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} NewsHub. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Powered by RSS Feeds | Built with Next.js & Tailwind CSS
        </p>
      </div>
    </footer>
  );
}
