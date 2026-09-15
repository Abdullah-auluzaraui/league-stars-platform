import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 16 || username === 'demo-admin') {
    throw new Error('Set ADMIN_USERNAME (other than demo-admin) and ADMIN_PASSWORD with at least 16 characters');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { username },
    update: { passwordHash, role: 'admin' },
    create: { username, passwordHash, role: 'admin' },
  });
  console.log('Configured admin account created or password rotated. No content was deleted.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => { await prisma.$disconnect(); });
