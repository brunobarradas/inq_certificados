import { Certificado } from '@/types/certificate';

// In-memory store (in production, use a real database)
const certificados: Map<string, Certificado> = new Map();

export function saveCertificado(cert: Certificado): void {
  certificados.set(cert.id, cert);
}

export function getCertificado(id: string): Certificado | undefined {
  return certificados.get(id);
}

export function getCertificadoByNumero(numero: string): Certificado | undefined {
  for (const cert of certificados.values()) {
    if (cert.numeroCertificado === numero) return cert;
  }
  return undefined;
}

export function getAllCertificados(): Certificado[] {
  return Array.from(certificados.values()).sort(
    (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  );
}
