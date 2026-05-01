import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { classifyAuthError } from './auth-errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// CredentialsSignin subclass so signIn() returns { error: 'CredentialsSignin', code }.
// Throwing a plain Error in NextAuth v5 surfaces as result.error === 'Configuration',
// which is what produced the user-visible "Registration failed: Configuration".
class AuthCodeError extends CredentialsSignin {
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'placeholder') {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}

providers.push(
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      let res: Response;
      try {
        res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });
      } catch {
        // Network failure / API unreachable. Surface as server_error rather than
        // letting NextAuth wrap it as a Configuration error.
        throw new AuthCodeError('server_error');
      }

      if (!res.ok) {
        // Defensive parse: a misconfigured proxy or 500 page can return non-JSON.
        // Falling through to server_error is better than throwing Configuration.
        let body: { message?: unknown } | null = null;
        try {
          body = await res.json();
        } catch {
          body = null;
        }
        throw new AuthCodeError(classifyAuthError(res.status, body));
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new AuthCodeError('server_error');
      }

      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        accessToken: data.accessToken,
      };
    },
  }),
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && 'accessToken' in user) {
        token.accessToken = user.accessToken;
        token.userId = user.id;
      }
      if (account?.provider === 'google' && account.access_token) {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: account.access_token }),
        });
        if (res.ok) {
          const data = await res.json();
          token.accessToken = data.accessToken;
          token.userId = data.user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.userId as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
});
