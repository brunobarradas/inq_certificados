import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

function mapCurso(c: Record<string, unknown>) {
  return {
    id: c.id, nome: c.nome, descricao: c.descricao,
    conteudoProgramatico: c.conteudo_programatico,
    duracaoPadrao: c.duracao_padrao, ativo: c.ativo, createdAt: c.created_at,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.nome                !== undefined) updates.nome                 = body.nome;
  if (body.descricao           !== undefined) updates.descricao            = body.descricao;
  if (body.conteudoProgramatico !== undefined) updates.conteudo_programatico = body.conteudoProgramatico;
  if (body.duracaoPadrao       !== undefined) updates.duracao_padrao       = body.duracaoPadrao;
  if (body.ativo               !== undefined) updates.ativo                = body.ativo;

  const { data, error } = await getSupabaseAdmin()
    .from('cursos').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: 'Erro ao actualizar' }, { status: 500 });
  return NextResponse.json(mapCurso(data));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { id } = await params;
  const { error } = await getSupabaseAdmin().from('cursos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Erro ao eliminar' }, { status: 500 });
  return NextResponse.json({ success: true });
}
