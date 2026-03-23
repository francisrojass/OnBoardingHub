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

  // ── 1. Crear (o reutilizar) las Boxes ─────────────────────────────────────
  const BOXES = [
    {
      title: 'Terminal Sandbox — Ubuntu Básico',
      description:
        'Entorno de terminal aislado basado en Ubuntu. Contiene Git, Curl, Vim y Nano. ' +
        'Ideal como primera toma de contacto con el flujo de trabajo de la empresa.',
      objectives:
        '1. Clonar un repositorio ficticio.\n' +
        '2. Crear una rama de feature.\n' +
        '3. Realizar un commit y lanzar una Pull Request simulada.',
      dockerImage: 'onboardinghub/ubuntu-basic',
      innerPort: 7681,
      difficulty: 'BEGINNER' as const,
    },
    {
      title: 'Entorno Fullstack — Node.js & Python',
      description:
        'Potente entorno de desarrollo interactivo. Incluye Node.js, NPM, Python 3, PIP y SQLite3. ' +
        'Configurado para desarrollar aplicaciones backend o ejecutar scripts avanzados de forma segura.',
      objectives:
        '1. Iniciar un proyecto con "npm init".\n' +
        '2. Instalar una dependencia.\n' +
        '3. Ejecutar un script para probar la red.',
      dockerImage: 'onboardinghub/fullstack-node-python',
      innerPort: 7681,
      difficulty: 'INTERMEDIATE' as const,
    }
  ];

  const createdBoxes = [];

  for (const boxData of BOXES) {
    let box = await prisma.box.findFirst({
      where: { dockerImage: boxData.dockerImage },
    });

    if (!box) {
      box = await prisma.box.create({ data: boxData });
      console.log(`  ✅  Box creada: "${box.title}" (id: ${box.id})`);
    } else {
      box = await prisma.box.update({
        where: { id: box.id },
        data: { title: boxData.title, description: boxData.description, objectives: boxData.objectives, innerPort: boxData.innerPort, difficulty: boxData.difficulty },
      });
      console.log(`  ♻️   Box ya existía — actualizada: "${box.title}" (id: ${box.id})`);
    }
    createdBoxes.push(box);
  }

  // ── 2. Asignar las Boxes a TODAS las empresas ───────────────────────────────
  const companies = await prisma.company.findMany();

  if (companies.length === 0) {
    console.log('  ⚠️   No hay empresas en la BD. Registra un usuario primero y vuelve a correr el seed.');
  } else {
    for (const company of companies) {
      for (const box of createdBoxes) {
        const exists = await prisma.companyBox.findUnique({
          where: { companyId_boxId: { companyId: company.id, boxId: box.id } },
        });

        if (!exists) {
          await prisma.companyBox.create({
            data: { companyId: company.id, boxId: box.id },
          });
          console.log(`  ✅  Box "${box.title}" asignada a empresa: "${company.name}"`);
        } else {
          console.log(`  ⏭️   "${box.title}" ya asignada a empresa: "${company.name}"`);
        }
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
