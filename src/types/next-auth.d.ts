import { DefaultSession } from 'next-auth';
import { UserRole } from '@/generated/prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      globalRole: UserRole;
      organizationId?: string;
      orgRole?: UserRole;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    globalRole: UserRole;
    organizationId?: string;
    orgRole?: UserRole;
  }
}
