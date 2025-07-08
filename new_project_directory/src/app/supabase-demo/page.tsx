// src/app/supabase-demo/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Post {
  id: number;
  title: string;
  // Add other relevant fields if your 'posts' table has them
  // created_at: string;
}

export default function SupabaseDemoPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!supabase) {
        setMessage(
          'Supabase client is not initialized. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file and restart the development server.'
        );
        setLoading(false);
        return;
      }

      setMessage('Attempting to fetch posts... (This will only work if Supabase is configured)');

      // **Important:** Before this code can work:
      // 1. Ensure your .env.local file has the correct Supabase URL and Anon key.
      // 2. Create a 'posts' table in your Supabase project.
      //    You can use the following SQL in the Supabase SQL Editor:
      //
      //    CREATE TABLE posts (
      //      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      //      title TEXT,
      //      created_at TIMESTAMPTZ DEFAULT NOW()
      //    );
      //    -- Optional: Enable Row Level Security (RLS) if you haven't already
      //    -- and define policies. For a quick test, you might temporarily disable it
      //    -- or create a permissive read policy:
      //    -- CREATE POLICY "Public posts are viewable by everyone."
      //    -- ON posts FOR SELECT USING (true);
      //
      // 3. (Optional but recommended) Insert some sample data into your 'posts' table.
      //    INSERT INTO posts (title) VALUES ('My First Post'), ('Another Interesting Article');

      try {
        // setLoading(true); // Already true
        // const { data, error: fetchError } = await supabase
        //   .from('posts')
        //   .select('*');

        // if (fetchError) {
        //   throw fetchError;
        // }

        // if (data) {
        //   setPosts(data as Post[]);
        //   setMessage('Posts fetched successfully! (If Supabase is configured and table exists)');
        // } else {
        //   setMessage('No posts found, or Supabase is not yet configured correctly.');
        // }
        console.log("Placeholder: Actual fetch logic is commented out until Supabase is configured.");
        setMessage("Placeholder: Actual fetch logic is commented out. This page demonstrates where to put your Supabase query. Please configure Supabase and uncomment the fetch logic in `src/app/supabase-demo/page.tsx` and create the 'posts' table in your Supabase dashboard.");

      } catch (e: any) {
        console.error('Error fetching posts:', e);
        setError(`Error fetching posts: ${e.message}. Check the console and ensure your 'posts' table exists and RLS policies allow access.`);
        setMessage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Demo Page</h1>

      {message && <p className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">{message}</p>}

      {loading && <p>Loading...</p>}

      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && supabase && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Fetched Posts:</h2>
          {posts.length > 0 ? (
            <ul>
              {posts.map((post) => (
                <li key={post.id} className="border-b p-2">
                  {post.title}
                </li>
              ))}
            </ul>
          ) : (
            <p>{!supabase ? "Supabase client not initialized." : "No posts to display. (Ensure Supabase is configured, the 'posts' table exists, contains data, and RLS policies are set correctly)."}</p>
          )}
        </div>
      )}

      {!supabase && (
        <div className="p-4 mt-4 bg-yellow-100 text-yellow-700 rounded">
          <p className="font-semibold">Supabase Client Not Initialized</p>
          <p>Please make sure you have:</p>
          <ol className="list-decimal list-inside ml-4">
            <li>Created a <code>.env.local</code> file in the project root (<code>new_project_directory</code>).</li>
            <li>Added your <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to it.</li>
            <li>Restarted your Next.js development server (<code>npm run dev</code>).</li>
          </ol>
          <p className="mt-2">The Supabase client setup is in <code>src/lib/supabaseClient.ts</code>.</p>
        </div>
      )}

      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Next Steps for Supabase Integration:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Create a <code>.env.local</code> file in the <code>new_project_directory</code> folder.</li>
          <li>Copy the contents of <code>.env.local.example</code> into <code>.env.local</code>.</li>
          <li>Replace the placeholder values in <code>.env.local</code> with your actual Supabase Project URL and Anon Key.</li>
          <li>In your Supabase project dashboard, go to the SQL Editor.</li>
          <li>Create the 'posts' table using the following SQL:
            <pre className="bg-gray-200 p-2 rounded mt-1 overflow-x-auto">
{`CREATE TABLE posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: Insert some sample data
-- INSERT INTO posts (title) VALUES ('My First Supabase Post'), ('Hello Next.js and Supabase!');

-- Important: Configure Row Level Security (RLS) for your tables.
-- For testing, you can create a policy that allows public read access:
-- CREATE POLICY "Public posts are viewable by everyone."
-- ON posts FOR SELECT USING (true);
-- Or, if you have auth setup, you might do:
-- CREATE POLICY "Users can view their own posts."
-- ON posts FOR SELECT USING (auth.uid() = user_id_column); -- Assuming you have a user_id_column
`}
            </pre>
          </li>
          <li>Uncomment the data fetching logic in this file (`src/app/supabase-demo/page.tsx`).</li>
          <li>Run your Next.js development server (<code>npm run dev</code>) and navigate to <code>/supabase-demo</code>.</li>
        </ol>
      </div>
    </div>
  );
}
