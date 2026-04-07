# 🎓 Sistema de Certificados INQ

Aplicação Next.js para emissão, gestão e verificação de certificados com QR Code único.

## Stack

- **Next.js 16** · **Supabase** (PostgreSQL) · **NextAuth v5** · **qrcode** · **html2canvas + jsPDF** · **Tailwind CSS**

---

## Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar base de dados no Supabase
1. Criar projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, executar o ficheiro `supabase/schema.sql`
3. Guardar as chaves em Project Settings → API

### 3. Variáveis de ambiente
```bash
cp .env.local.example .env.local
# Editar .env.local com os seus valores
```

### 4. Gerar hash da palavra-passe admin
```bash
node scripts/generate-hash.mjs MinhaPasswordSegura123
# Copiar o resultado para ADMIN_PASSWORD_HASH no .env.local
```

### 5. Iniciar
```bash
npm run dev
# http://localhost:3000  →  redireciona para /admin/login
```

---

## Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/admin/login` | Público | Login |
| `/admin` | 🔒 Admin | Dashboard + Emitir + Lista |
| `/verificar/[id]` | Público | Verificação via QR Code |

## Funcionalidades
- ✅ Emissão com número único `INQ-YYYY-XXXXXX`
- ✅ QR Code azul INQ por certificado
- ✅ Verificação pública via URL do QR Code
- ✅ **Exportação PDF** A4 horizontal
- ✅ **Autenticação JWT** (email + palavra-passe)
- ✅ **Supabase** com RLS activado
- ✅ Pesquisa em tempo real
- ✅ Dashboard com estatísticas
- ✅ Eliminar certificados (apenas admin)

## Deploy (Vercel)
```bash
vercel deploy
# Configurar env vars no painel Vercel
# Alterar NEXTAUTH_URL para o domínio de produção
```
