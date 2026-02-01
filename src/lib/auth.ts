import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await db.user.findUnique({
            where: { email },
            include: {
              organizations: {
                where: { isDefault: true },
                include: { organization: true },
                take: 1,
              },
            },
          });

          if (!user || !user.email) {
            return null;
          }

          // Validate password if hashed password exists
          if (user.hashedPassword) {
            const passwordMatch = await compare(password, user.hashedPassword);
            if (!passwordMatch) {
              return null;
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user || trigger === 'update') {
        const dbUser = await db.user.findUnique({
          where: { id: (user?.id ?? token.id) as string },
          include: {
            organizations: {
              where: { isDefault: true },
              include: { organization: true },
              take: 1,
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.globalRole = dbUser.globalRole;

          const defaultOrg = dbUser.organizations[0];
          if (defaultOrg) {
            token.organizationId = defaultOrg.organizationId;
            token.orgRole = defaultOrg.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.globalRole = token.globalRole as import('@/generated/prisma/client').UserRole;
        session.user.organizationId = token.organizationId as string | undefined;
        session.user.orgRole = token.orgRole as
          | import('@/generated/prisma/client').UserRole
          | undefined;
      }
      return session;
    },
  },
});
