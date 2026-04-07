export interface Certificado {
  id: string;
  numeroCertificado: string;
  nomeFormando: string;
  curso: string;
  cursoId?: string;
  dataEmissao: string;
  dataValidade?: string;
  duracao?: string;
  instituicao?: string;
  diretor?: string;
  cargoDir?: string;
  qrCodeUrl?: string;
  createdAt?: string;
}

export interface CertificadoFormData {
  nomeFormando: string;
  curso: string;
  cursoId?: string;
  dataEmissao: string;
  dataValidade?: string;
  duracao?: string;
}

export interface Curso {
  id: string;
  nome: string;
  descricao?: string;
  conteudoProgramatico?: string;
  duracaoPadrao?: string;
  ativo: boolean;
  createdAt?: string;
}
