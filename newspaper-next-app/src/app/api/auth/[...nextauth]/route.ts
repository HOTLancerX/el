import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// Import other providers as needed, e.g., GitHub, Google

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        // IMPORTANT: NEVER store passwords in plaintext. Hash and salt them.
        // For now, returning a dummy user for setup purposes.
        // Replace this with actual user validation logic against your database.
        if (credentials?.username === 'admin' && credentials?.password === 'password') {
          return { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' };
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
    // ...add more providers here
  ],
  // Optional: Add session strategy, callbacks, pages, etc.
  session: {
    strategy: 'jwt', // Using JWT for session strategy
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user role to the token right after signin
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user role.
      if (session.user && token.role) {
        session.user.role = token.role as string; // Cast role to string
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Optional: Custom sign-in page
    // error: '/auth/error', // Optional: Custom error page
  },
  // You'll need to set a NEXTAUTH_SECRET environment variable
  // Generate one using: openssl rand -base64 32
  // Add it to .env.local
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
