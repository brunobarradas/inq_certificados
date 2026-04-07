import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

function mapUser(u: Record<string, unknown>) {
  return {
    id:        u.id,
    nome:      u.nome,
    email:     u.email,
    role:      u.role,
    ativo:     u.ativo,
    createdAt: u.created_at,
  };
}

// Listar utilizadores — apenas admin
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { data, error } = await getSupabaseAdmin()
    .from('utilizadores')
    .select('id, nome, email, role, ativo, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Erro ao listar utilizadores' }, { status: 500 });
  return NextResponse.json((data || []).map(mapUser));
}

// Criar utilizador — apenas admin
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const body = await request.json();
  const { nome, email, password, role } = body;

  if (!nome || !email || !password || !role)
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });

  if (!['admin', 'utilizador'].includes(role))
    return NextResponse.json({ error: 'Role inválido' }, { status: 400 });

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await getSupabaseAdmin()
    .from('utilizadores')
    .insert({ nome, email: email.toLowerCase().trim(), password_hash, role })
    .select('id, nome, email, role, ativo, created_at')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Email já existe' }, { status: 409 });
    return NextResponse.json({ error: 'Erro ao criar utilizador' }, { status: 500 });
  }

  return NextResponse.json(mapUser(data), { status: 201 });
}
