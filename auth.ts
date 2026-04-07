import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email    = (credentials?.email    as string)?.trim().toLowerCase();
        const password =  credentials?.password as string;

        if (!email || !password) return null;

        // Buscar utilizador activo na base de dados
        const db = getSupabaseAdmin();
        const { data: user, error } = await db
          .from('utilizadores')
          .select('id, nome, email, password_hash, role, ativo')
          .eq('email', email)
          .eq('ativo', true)
          .single();

        if (error || !user) return null;

        // Verificar password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.nome,
          role:  user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id     = token.id   as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
});
