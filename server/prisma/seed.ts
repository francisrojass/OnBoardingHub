/**
 * Seed script — OnBoardingHub
 * Crea la Box demo "Terminal Git" y la asigna a todas las empresas existentes.
 *
 * Uso: ts-node prisma/seed.ts
 *      o via: npm run prisma:seed
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱  Iniciando seed...');

  // ── 1. Crear (o reutilizar) la Box demo ─────────────────────────────────────
  const DEMO_BOX = {
    title: 'Terminal Sandbox — Onboarding Básico',
    description:
      'Entorno de terminal aislado donde practicar comandos de Git y bash sin riesgo. ' +
      'Ideal como primera toma de contacto con el flujo de trabajo de la empresa.',
    objectives:
      '1. Clonar un repositorio ficticio.\n' +
      '2. Crear una rama de feature.\n' +
      '3. Realizar un commit y lanzar una Pull Request simulada.',
    dockerImage: 'tsl0922/ttyd',
    innerPort: 7681,
    difficulty: 'BEGINNER' as const,
  };

  let box = await prisma.box.findFirst({
    where: { dockerImage: DEMO_BOX.dockerImage },
  });

  if (!box) {
    box = await prisma.box.create({ data: DEMO_BOX });
    console.log(`  ✅  Box creada: "${box.title}" (id: ${box.id})`);
  } else {
    // Update in case fields changed
    box = await prisma.box.update({
      where: { id: box.id },
      data: { title: DEMO_BOX.title, description: DEMO_BOX.description, objectives: DEMO_BOX.objectives, innerPort: DEMO_BOX.innerPort },
    });
    console.log(`  ♻️   Box ya existía — actualizada: "${box.title}" (id: ${box.id})`);
  }

  // ── 2. Asignar la Box a TODAS las empresas ───────────────────────────────────
  const companies = await prisma.company.findMany();

  if (companies.length === 0) {
    console.log('  ⚠️   No hay empresas en la BD. Registra un usuario primero y vuelve a correr el seed.');
  } else {
    for (const company of companies) {
      const exists = await prisma.companyBox.findUnique({
        where: { companyId_boxId: { companyId: company.id, boxId: box.id } },
      });

      if (!exists) {
        await prisma.companyBox.create({
          data: { companyId: company.id, boxId: box.id },
        });
        console.log(`  ✅  Box asignada a empresa: "${company.name}"`);
      } else {
        console.log(`  ⏭️   Ya asignada a empresa: "${company.name}"`);
      }
    }
  }

  console.log('🏁  Seed completado.');
}

main()
  .catch((e) => {
    console.error('❌  Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
