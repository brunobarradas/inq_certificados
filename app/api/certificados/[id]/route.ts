import { NextRequest, NextResponse } from 'next/server';
import { getSupabasePublic, getSupabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id, numeroCertificado: row.numero_certificado, nomeFormando: row.nome_formando,
    curso: row.curso, dataEmissao: row.data_emissao, dataValidade: row.data_validade,
    duracao: row.duracao, instituicao: row.instituicao, diretor: row.diretor,
    cargoDir: row.cargo_dir, qrCodeUrl: row.qr_code_url, createdAt: row.created_at,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await getSupabasePublic().from('certificados').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 });
  return NextResponse.json(mapRow(data));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from('certificados').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Erro ao eliminar' }, { status: 500 });
  return NextResponse.json({ success: true });
}
