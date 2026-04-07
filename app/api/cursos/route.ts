import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getSupabasePublic } from '@/lib/supabase';
import { auth } from '@/auth';

function mapCurso(c: Record<string, unknown>) {
  return {
    id: c.id, nome: c.nome, descricao: c.descricao,
    conteudoProgramatico: c.conteudo_programatico,
    duracaoPadrao: c.duracao_padrao, ativo: c.ativo, createdAt: c.created_at,
  };
}

// Leitura pública (para emissão de certificados)
export async function GET() {
  const { data, error } = await getSupabasePublic()
    .from('cursos').select('*').eq('ativo', true).order('nome');
  if (error) return NextResponse.json({ error: 'Erro ao listar cursos' }, { status: 500 });
  return NextResponse.json((data || []).map(mapCurso));
}

// Criar curso — apenas admin
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const body = await request.json();
  const { nome, descricao, conteudoProgramatico, duracaoPadrao } = body;
  if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('cursos')
    .insert({ nome, descricao, conteudo_programatico: conteudoProgramatico, duracao_padrao: duracaoPadrao })
    .select().single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Curso já existe' }, { status: 409 });
    return NextResponse.json({ error: 'Erro ao criar curso' }, { status: 500 });
  }
  return NextResponse.json(mapCurso(data), { status: 201 });
}
