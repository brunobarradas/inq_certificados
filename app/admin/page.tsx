'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Certificado, CertificadoFormData, Curso } from '@/types/certificate';
import CertificadoPreview from '@/components/CertificadoPreview';

interface Utilizador {
  id: string; nome: string; email: string;
  role: 'admin' | 'utilizador'; ativo: boolean; createdAt: string;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      role === 'admin' ? 'bg-blue-950/60 border border-blue-500/40 text-blue-300' : 'bg-slate-800 border border-slate-600 text-slate-300'
    }`}>{role === 'admin' ? '👑 Admin' : '👤 Utilizador'}</span>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-white text-3xl font-bold">{value}</p>
    </div>
  );
}

type Tab = 'dashboard' | 'emitir' | 'certificados' | 'cursos' | 'utilizadores';

export default function AdminPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  const [tab, setTab]                     = useState<Tab>('dashboard');
  const [certificados, setCertificados]   = useState<Certificado[]>([]);
  const [utilizadores, setUtilizadores]   = useState<Utilizador[]>([]);
  const [cursos, setCursos]               = useState<Curso[]>([]);
  const [preview, setPreview]             = useState<Certificado | null>(null);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Forms
  const [certForm, setCertForm] = useState<CertificadoFormData>({
    nomeFormando: '', curso: '', dataEmissao: new Date().toISOString().split('T')[0], duracao: '', dataValidade: '',
  });
  const [cursoForm, setCursoForm] = useState({ nome: '', descricao: '', conteudoProgramatico: '', duracaoPadrao: '' });
  const [editCurso, setEditCurso] = useState<Curso | null>(null);
  const [cursoFormOpen, setCursoFormOpen] = useState(false);
  const [userForm, setUserForm]   = useState({ nome: '', email: '', password: '', role: 'utilizador' });
  const [editUser, setEditUser]   = useState<Utilizador | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);

  // Fetch
  const fetchCerts = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const r = await fetch(`/api/certificados${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      if (r.ok) setCertificados(await r.json());
    } finally { setLoading(false); }
  }, []);

  const fetchCursos = useCallback(async () => {
    const r = await fetch('/api/cursos');
    if (r.ok) setCursos(await r.json());
  }, []);

  const fetchUsers = useCallback(async () => {
    const r = await fetch('/api/utilizadores');
    if (r.ok) setUtilizadores(await r.json());
  }, []);

  useEffect(() => {
    fetchCerts(); fetchCursos();
    if (isAdmin) fetchUsers();
  }, [fetchCerts, fetchCursos, fetchUsers, isAdmin]);

  // Auto-preencher duração ao escolher curso
  const handleCursoSelect = (nome: string) => {
    const found = cursos.find(c => c.nome === nome);
    setCertForm(f => ({ ...f, curso: nome, duracao: found?.duracaoPadrao || f.duracao }));
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchCerts(v), 400);
  };

  // Submit certificado
  const handleSubmitCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true); setError(''); setSuccess('');
    try {
      const r = await fetch('/api/certificados', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(certForm),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setPreview(data);
      setSuccess(`Certificado ${data.numeroCertificado} emitido!`);
      setCertForm({ nomeFormando: '', curso: '', dataEmissao: new Date().toISOString().split('T')[0], duracao: '', dataValidade: '' });
      fetchCerts(); setTab('certificados');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao emitir');
    } finally { setSubmitLoading(false); }
  };

  // Submit curso
  const handleSubmitCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true); setError(''); setSuccess('');
    try {
      const url    = editCurso ? `/api/cursos/${editCurso.id}` : '/api/cursos';
      const method = editCurso ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cursoForm),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setSuccess(editCurso ? 'Curso actualizado!' : 'Curso criado!');
      setCursoForm({ nome: '', descricao: '', conteudoProgramatico: '', duracaoPadrao: '' });
      setCursoFormOpen(false); setEditCurso(null);
      fetchCursos();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar curso');
    } finally { setSubmitLoading(false); }
  };

  // Submit utilizador
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true); setError(''); setSuccess('');
    try {
      const url    = editUser ? `/api/utilizadores/${editUser.id}` : '/api/utilizadores';
      const method = editUser ? 'PATCH' : 'POST';
      const payload = editUser
        ? { nome: userForm.nome, role: userForm.role, ...(userForm.password ? { password: userForm.password } : {}) }
        : userForm;
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error((await r.json()).error);
      setSuccess(editUser ? 'Utilizador actualizado!' : 'Utilizador criado!');
      setUserForm({ nome: '', email: '', password: '', role: 'utilizador' });
      setUserFormOpen(false); setEditUser(null); fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar');
    } finally { setSubmitLoading(false); }
  };

  const deleteCert   = async (id: string) => { if (!confirm('Eliminar certificado?')) return; await fetch(`/api/certificados/${id}`, { method: 'DELETE' }); fetchCerts(search); };
  const deleteCurso  = async (id: string) => { if (!confirm('Eliminar curso?')) return; await fetch(`/api/cursos/${id}`, { method: 'DELETE' }); fetchCursos(); };
  const deleteUser   = async (u: Utilizador) => { if (!confirm(`Eliminar ${u.nome}?`)) return; const r = await fetch(`/api/utilizadores/${u.id}`, { method: 'DELETE' }); if (!r.ok) { setError((await r.json()).error); return; } fetchUsers(); };
  const toggleAtivo  = async (u: Utilizador) => { await fetch(`/api/utilizadores/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !u.ativo }) }); fetchUsers(); };

  const last30 = certificados.filter(c => Date.now() - new Date(c.createdAt || '').getTime() < 30 * 86400000).length;

  const tabs: [Tab, string][] = [
    ['dashboard',    '📊 Dashboard'],
    ['emitir',       '+ Emitir'],
    ['certificados', `📋 Certificados (${certificados.length})`],
    ['cursos',       `📚 Cursos (${cursos.length})`],
    ...(isAdmin ? [['utilizadores', `👥 Utilizadores (${utilizadores.length})`] as [Tab, string]] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm shadow-lg shadow-blue-900/40">INQ</div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Painel de Administração</h1>
              <p className="text-slate-500 text-xs">{session?.user?.name} · <RoleBadge role={(session?.user as {role?:string})?.role || ''} /></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden lg:flex gap-1 bg-slate-800 rounded-xl p-1">
              {tabs.map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </nav>
            <button onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-sm transition">Sair</button>
          </div>
        </div>
        <div className="lg:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
          {tabs.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {label.replace(/\(.*\)/, '').trim()}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {success && <div className="mb-5 bg-green-950/50 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex justify-between"><span>✓ {success}</span><button onClick={() => setSuccess('')}>✕</button></div>}
        {error   && <div className="mb-5 bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex justify-between"><span>⚠ {error}</span><button onClick={() => setError('')}>✕</button></div>}

        {/* ════ DASHBOARD ════ */}
        {tab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Visão Geral</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Certificados" value={certificados.length} icon="🎓" />
              <StatCard label="Últimos 30 dias"    value={last30}             icon="📅" />
              <StatCard label="Cursos activos"     value={cursos.length}      icon="📚" />
              {isAdmin && <StatCard label="Utilizadores" value={utilizadores.length} icon="👥" />}
            </div>
            <h3 className="text-lg font-semibold mb-4 text-slate-300">Emissões Recentes</h3>
            {certificados.slice(0, 5).map(cert => (
              <div key={cert.id} className="flex items-center gap-4 bg-slate-900 border border-slate-700/40 rounded-xl p-4 mb-3 hover:border-blue-500/20 transition-all">
                {cert.qrCodeUrl && <img src={cert.qrCodeUrl} alt="QR" className="w-12 h-12 rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{cert.nomeFormando}</p>
                  <p className="text-slate-400 text-sm truncate">{cert.curso}</p>
                </div>
                <span className="text-blue-300 text-xs font-mono hidden md:block">{cert.numeroCertificado}</span>
                <button onClick={() => setPreview(cert)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">Ver</button>
              </div>
            ))}
            {certificados.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <p className="text-3xl mb-2">📋</p><p>Nenhum certificado emitido.</p>
                <button onClick={() => setTab('emitir')} className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition">Emitir primeiro</button>
              </div>
            )}
          </div>
        )}

        {/* ════ EMITIR ════ */}
        {tab === 'emitir' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Emitir Novo Certificado</h2>
            <p className="text-slate-400 text-sm mb-8">O QR Code de verificação único será gerado automaticamente.</p>
            <form onSubmit={handleSubmitCert} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Nome Completo do Formando *</label>
                <input type="text" value={certForm.nomeFormando} onChange={e => setCertForm({ ...certForm, nomeFormando: e.target.value })}
                  placeholder="Ex: Bruno Barradas" required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Curso / Formação *</label>
                <select value={certForm.curso} onChange={e => handleCursoSelect(e.target.value)} required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition">
                  <option value="">— Seleccione um curso —</option>
                  {cursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  <option value="__custom__">Outro (personalizado)</option>
                </select>
              </div>
              {certForm.curso === '__custom__' && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Nome do Curso *</label>
                  <input type="text" placeholder="Nome da formação..." onChange={e => setCertForm({ ...certForm, curso: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Data de Emissão *</label>
                  <input type="date" value={certForm.dataEmissao} onChange={e => setCertForm({ ...certForm, dataEmissao: e.target.value })} required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Data de Validade</label>
                  <input type="date" value={certForm.dataValidade} onChange={e => setCertForm({ ...certForm, dataValidade: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition" />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Duração</label>
                <input type="text" value={certForm.duracao} onChange={e => setCertForm({ ...certForm, duracao: e.target.value })} placeholder="Ex: 40 horas"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition" />
              </div>
              <button type="submit" disabled={submitLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl transition text-sm">
                {submitLoading ? 'A gerar certificado e QR Code...' : '🎓 Emitir Certificado'}
              </button>
            </form>
          </div>
        )}

        {/* ════ CERTIFICADOS ════ */}
        {tab === 'certificados' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div><h2 className="text-2xl font-bold">Certificados Emitidos</h2><p className="text-slate-400 text-sm">{certificados.length} resultado(s)</p></div>
              <div className="flex gap-3">
                <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder="Pesquisar..."
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm w-56" />
                <button onClick={() => setTab('emitir')} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">+ Novo</button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-16 text-slate-500"><span className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin inline-block mb-3"/><p>A carregar...</p></div>
            ) : certificados.length === 0 ? (
              <div className="text-center py-16 text-slate-500"><p className="text-3xl mb-2">🔍</p><p>Sem resultados.</p></div>
            ) : (
              <div className="grid gap-3">
                {certificados.map(cert => (
                  <div key={cert.id} className="bg-slate-900 border border-slate-700/40 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:border-blue-500/20 transition-all">
                    {cert.qrCodeUrl && <img src={cert.qrCodeUrl} alt="QR" className="w-14 h-14 rounded-lg flex-shrink-0"/>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold leading-tight">{cert.nomeFormando}</p>
                          <p className="text-slate-400 text-sm mt-0.5 truncate">{cert.curso}</p>
                        </div>
                        <span className="hidden md:block flex-shrink-0 bg-blue-950/60 border border-blue-500/30 rounded-lg px-2.5 py-1 text-blue-300 text-xs font-mono">{cert.numeroCertificado}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-slate-500 text-xs">📅 {new Date(cert.dataEmissao || '').toLocaleDateString('pt-PT')}</span>
                        {cert.duracao && <span className="text-slate-500 text-xs">⏱ {cert.duracao}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setPreview(cert)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Ver / PDF</button>
                      <a href={`/verificar/${cert.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-900/40 border border-green-500/30 text-green-400 rounded-lg text-sm transition hidden md:block">🔗</a>
                      {isAdmin && <button onClick={() => deleteCert(cert.id as string)} className="px-3 py-2 bg-red-950/40 border border-red-500/20 text-red-400 rounded-lg text-sm transition">🗑</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ CURSOS ════ */}
        {tab === 'cursos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-2xl font-bold">Gestão de Cursos</h2><p className="text-slate-400 text-sm">{cursos.length} curso(s) activo(s)</p></div>
              {isAdmin && (
                <button onClick={() => { setEditCurso(null); setCursoForm({ nome: '', descricao: '', conteudoProgramatico: '', duracaoPadrao: '' }); setCursoFormOpen(true); }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition">
                  + Novo Curso
                </button>
              )}
            </div>

            {/* Formulário curso */}
            {cursoFormOpen && isAdmin && (
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold mb-5">{editCurso ? `Editar: ${editCurso.nome}` : 'Novo Curso'}</h3>
                <form onSubmit={handleSubmitCurso} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">Nome do Curso *</label>
                      <input type="text" value={cursoForm.nome} onChange={e => setCursoForm({ ...cursoForm, nome: e.target.value })}
                        placeholder="Ex: Metodologia de Abordagem por Competências" required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1.5">Duração Padrão</label>
                      <input type="text" value={cursoForm.duracaoPadrao} onChange={e => setCursoForm({ ...cursoForm, duracaoPadrao: e.target.value })}
                        placeholder="Ex: 40 horas"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Descrição</label>
                    <input type="text" value={cursoForm.descricao} onChange={e => setCursoForm({ ...cursoForm, descricao: e.target.value })}
                      placeholder="Breve descrição do curso..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">
                      Conteúdo Programático
                      <span className="ml-2 text-slate-500 text-xs font-normal">— impresso no verso do certificado em 2 colunas</span>
                    </label>
                    <textarea
                      value={cursoForm.conteudoProgramatico}
                      onChange={e => setCursoForm({ ...cursoForm, conteudoProgramatico: e.target.value })}
                      placeholder={`Módulo 1 — Introdução\n• Tópico 1\n• Tópico 2\n\nMódulo 2 — Desenvolvimento\n• Tópico 3\n• Tópico 4`}
                      rows={14}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm font-mono resize-y"
                    />
                    <p className="text-slate-600 text-xs mt-1">Use "Módulo X —" para cabeçalhos e "•" para tópicos. O texto é dividido automaticamente em 2 colunas.</p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => { setCursoFormOpen(false); setEditCurso(null); }}
                      className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition">Cancelar</button>
                    <button type="submit" disabled={submitLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition">
                      {submitLoading ? 'A guardar...' : editCurso ? 'Guardar alterações' : 'Criar curso'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de cursos */}
            <div className="grid gap-4">
              {cursos.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-700/40 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white">{c.nome}</h3>
                        {c.duracaoPadrao && <span className="text-slate-500 text-xs bg-slate-800 px-2 py-0.5 rounded">⏱ {c.duracaoPadrao}</span>}
                      </div>
                      {c.descricao && <p className="text-slate-400 text-sm mb-2">{c.descricao}</p>}
                      {c.conteudoProgramatico ? (
                        <p className="text-slate-600 text-xs">
                          📋 {c.conteudoProgramatico.split('\n').filter(l => l.trim()).length} linhas de conteúdo programático
                        </p>
                      ) : (
                        <p className="text-yellow-600 text-xs">⚠ Sem conteúdo programático — o verso do certificado ficará em branco</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => {
                          setEditCurso(c);
                          setCursoForm({ nome: c.nome, descricao: c.descricao || '', conteudoProgramatico: c.conteudoProgramatico || '', duracaoPadrao: c.duracaoPadrao || '' });
                          setCursoFormOpen(true);
                        }} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Editar</button>
                        <button onClick={() => deleteCurso(c.id)} className="px-3 py-2 bg-red-950/40 border border-red-500/20 text-red-400 rounded-lg text-sm transition">🗑</button>
                      </div>
                    )}
                  </div>
                  {/* Preview do conteúdo */}
                  {c.conteudoProgramatico && (
                    <details className="mt-3">
                      <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-300 transition">Ver conteúdo programático</summary>
                      <pre className="mt-2 text-slate-400 text-xs bg-slate-800/50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                        {c.conteudoProgramatico}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              {cursos.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-3xl mb-2">📚</p><p>Nenhum curso criado ainda.</p>
                  {isAdmin && <button onClick={() => setCursoFormOpen(true)} className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition">Criar primeiro curso</button>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ UTILIZADORES ════ */}
        {tab === 'utilizadores' && isAdmin && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-2xl font-bold">Gestão de Utilizadores</h2><p className="text-slate-400 text-sm">{utilizadores.length} utilizador(es)</p></div>
              <button onClick={() => { setEditUser(null); setUserForm({ nome: '', email: '', password: '', role: 'utilizador' }); setUserFormOpen(true); }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition">+ Novo Utilizador</button>
            </div>
            {userFormOpen && (
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">{editUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h3>
                <form onSubmit={handleSubmitUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Nome *</label>
                    <input type="text" value={userForm.nome} onChange={e => setUserForm({ ...userForm, nome: e.target.value })} required placeholder="Nome completo"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Email *</label>
                    <input type="email" value={editUser ? editUser.email : userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      disabled={!!editUser} required placeholder="email@inq.ao"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">{editUser ? 'Nova Password (opcional)' : 'Password *'}</label>
                    <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                      required={!editUser} minLength={6} placeholder="••••••••"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1.5">Tipo *</label>
                    <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-sm">
                      <option value="utilizador">👤 Utilizador</option>
                      <option value="admin">👑 Administrador</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-3 justify-end">
                    <button type="button" onClick={() => { setUserFormOpen(false); setEditUser(null); }} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition">Cancelar</button>
                    <button type="submit" disabled={submitLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition">
                      {submitLoading ? 'A guardar...' : editUser ? 'Guardar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="grid gap-3">
              {utilizadores.map(u => (
                <div key={u.id} className="bg-slate-900 border border-slate-700/40 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg flex-shrink-0">{u.role === 'admin' ? '👑' : '👤'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{u.nome}</p><RoleBadge role={u.role}/>
                      {!u.ativo && <span className="bg-red-950/60 border border-red-500/30 text-red-400 text-xs px-2 py-0.5 rounded-full">Inactivo</span>}
                    </div>
                    <p className="text-slate-400 text-sm">{u.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditUser(u); setUserForm({ nome: u.nome, email: u.email, password: '', role: u.role }); setUserFormOpen(true); }} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">Editar</button>
                    <button onClick={() => toggleAtivo(u)} className={`px-3 py-2 rounded-lg text-sm transition border ${u.ativo ? 'bg-yellow-950/40 border-yellow-500/20 text-yellow-400' : 'bg-green-950/40 border-green-500/20 text-green-400'}`}>{u.ativo ? 'Desactivar' : 'Activar'}</button>
                    <button onClick={() => deleteUser(u)} className="px-3 py-2 bg-red-950/40 border border-red-500/20 text-red-400 rounded-lg text-sm transition">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {preview && <CertificadoPreview cert={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
