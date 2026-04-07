import { NextRequest, NextResponse } from 'next/server';
import { generateQRCode, generateNumeroCertificado } from '@/lib/qrcode';
import { getSupabaseAdmin } from '@/lib/supabase';
import { auth } from '@/auth';

function mapRow(row: Record<string, unknown>) {
  return {
    id: row.id, numeroCertificado: row.numero_certificado, nomeFormando: row.nome_formando,
    curso: row.curso, dataEmissao: row.data_emissao, dataValidade: row.data_validade,
    duracao: row.duracao, instituicao: row.instituicao, diretor: row.diretor,
    cargoDir: row.cargo_dir, qrCodeUrl: row.qr_code_url, createdAt: row.created_at,
  };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await request.json();
  const { nomeFormando, curso, dataEmissao, dataValidade, duracao } = body;
  if (!nomeFormando || !curso || !dataEmissao)
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 });

  const db = getSupabaseAdmin();
  const numeroCertificado = generateNumeroCertificado();

  const { data: inserted, error: e1 } = await db
    .from('certificados')
    .insert({ numero_certificado: numeroCertificado, nome_formando: nomeFormando, curso, data_emissao: dataEmissao, data_validade: dataValidade || null, duracao: duracao || null })
    .select().single();

  if (e1 || !inserted) { console.error(e1); return NextResponse.json({ error: 'Erro ao guardar' }, { status: 500 }); }

  const qrCodeUrl = await generateQRCode(`${request.nextUrl.origin}/verificar/${inserted.id}`);

  const { data: updated, error: e2 } = await db
    .from('certificados').update({ qr_code_url: qrCodeUrl }).eq('id', inserted.id).select().single();

  if (e2 || !updated) return NextResponse.json({ error: 'Erro ao actualizar QR Code' }, { status: 500 });
  return NextResponse.json(mapRow(updated), { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q') || '';
  const db = getSupabaseAdmin();
  let query = db.from('certificados').select('*').order('created_at', { ascending: false });
  if (q) query = query.or(`nome_formando.ilike.%${q}%,numero_certificado.ilike.%${q}%,curso.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 });
  return NextResponse.json((data || []).map(mapRow));
}
