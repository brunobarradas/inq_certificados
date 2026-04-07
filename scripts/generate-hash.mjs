#!/usr/bin/env node
/**
 * Gera o hash bcrypt para a palavra-passe do administrador.
 * Uso: node scripts/generate-hash.mjs <palavra-passe>
 *
 * Coloque o resultado em ADMIN_PASSWORD_HASH no ficheiro .env.local
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt  = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌  Uso: node scripts/generate-hash.mjs <palavra-passe>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\n✅  Hash gerado com sucesso!\n');
console.log('Adicione ao seu .env.local:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
