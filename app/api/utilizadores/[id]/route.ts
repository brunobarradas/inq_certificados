import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

// Actualizar utilizador (role, ativo, password) — apenas admin
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.nome     !== undefined) updates.nome  = body.nome;
  if (body.role     !== undefined) updates.role  = body.role;
  if (body.ativo    !== undefined) updates.ativo = body.ativo;
  if (body.password !== undefined) updates.password_hash = await bcrypt.hash(body.password, 10);

  const { data, error } = await getSupabaseAdmin()
    .from('utilizadores')
    .update(updates)
    .eq('id', id)
    .select('id, nome, email, role, ativo, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'Erro ao actualizar' }, { status: 500 });
  return NextResponse.json({ id: data.id, nome: data.nome, email: data.email, role: data.role, ativo: data.ativo, createdAt: data.created_at });
}

// Eliminar utilizador — apenas admin (não pode eliminar a si próprio)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { id } = await params;
  const sessionUserId = (session.user as { id?: string })?.id;
  if (id === sessionUserId) return NextResponse.json({ error: 'Não pode eliminar a sua própria conta' }, { status: 400 });

  const { error } = await getSupabaseAdmin().from('utilizadores').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Erro ao eliminar' }, { status: 500 });
  return NextResponse.json({ success: true });
}
