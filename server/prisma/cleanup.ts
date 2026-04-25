import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const images = ['onboardinghub/ubuntu-basic', 'onboardinghub/fullstack-node-python'];
  const old = await prisma.box.findMany({ where: { dockerImage: { in: images } } });

  for (const b of old) {
    await prisma.boxProgress.deleteMany({ where: { boxId: b.id } });
    await prisma.task.deleteMany({ where: { boxId: b.id } });
    await prisma.companyBox.deleteMany({ where: { boxId: b.id } });
    await prisma.sandbox.deleteMany({ where: { boxId: b.id } });
    await prisma.box.delete({ where: { id: b.id } });
    console.log('Deleted box:', b.title);
  }

  if (old.length === 0) console.log('No old boxes found to delete');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
