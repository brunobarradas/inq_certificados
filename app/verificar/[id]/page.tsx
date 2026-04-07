'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Certificado } from '@/types/certificate';

export default function VerificarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cert, setCert] = useState<Certificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/certificados/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setCert(data);
      })
      .catch(() => setError('Erro ao verificar certificado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-blue-400 text-xl animate-pulse">A verificar certificado...</div>
    </div>
  );

  if (error || !cert) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-red-950/50 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-red-400 text-2xl font-bold mb-2">Certificado Inválido</h1>
        <p className="text-red-300/70">Este certificado não foi encontrado ou é inválido.</p>
      </div>
    </div>
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-PT');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-green-950/60 border border-green-500/40 rounded-full px-6 py-3">
            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-green-400 font-semibold text-sm tracking-wider uppercase">Certificado Válido e Autêntico</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 shadow-2xl text-white">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎓</div>
            <h1 className="text-2xl font-bold mb-1">{cert.nomeFormando}</h1>
            <p className="text-slate-400 text-sm">Formando Certificado</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Curso', value: cert.curso },
              { label: 'Nº Certificado', value: cert.numeroCertificado, highlight: true },
              { label: 'Data de Emissão', value: formatDate(cert.dataEmissao) },
              ...(cert.dataValidade ? [{ label: 'Válido Até', value: formatDate(cert.dataValidade) }] : []),
              ...(cert.duracao ? [{ label: 'Duração', value: cert.duracao }] : []),
              { label: 'Instituição', value: cert.instituicao },
            ].map(({ label, value, highlight }) => (
              <div key={label} className={`rounded-xl p-3 ${highlight ? 'bg-blue-950/50 border border-blue-500/30' : 'bg-slate-800/50'}`}>
                <p className="text-slate-500 text-xs mb-1">{label}</p>
                <p className={`font-semibold text-sm ${highlight ? 'text-blue-300' : 'text-white'}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700/50 pt-5 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">{cert.diretor}</p>
              <p className="text-slate-400 text-xs">{cert.cargoDir}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-xs">Verificado em</p>
              <p className="text-slate-300 text-xs">{new Date().toLocaleDateString('pt-PT')}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">ID: {cert.id}</p>
      </div>
    </div>
  );
}
