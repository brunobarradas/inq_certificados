import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
  const dataUrl = await QRCode.toDataURL(text, {
    width: 200,
    margin: 2,
    color: {
      dark: '#1e3a8a',
      light: '#f8f9ff',
    },
    errorCorrectionLevel: 'H',
  });
  return dataUrl;
}

export function generateNumeroCertificado(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `INQ-${year}-${random}`;
}
