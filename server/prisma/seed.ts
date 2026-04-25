/**
 * Seed script — OnBoardingHub
 * Sincroniza boxes desde las carpetas de sandbox y las asigna a todas las empresas.
 *
 * Uso: npm run prisma:seed
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SANDBOXES_DIR = path.resolve(__dirname, '../../docker/sandboxes');

interface SandboxMetadata {
  title: string;
  description: string;
  objectives: string;
  guide?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  innerPort: number;
  xpReward: number;
}

async function main() {
  console.log('🌱  Iniciando seed...');

  // ── 1. Sync boxes from docker/sandboxes/*/metadata.json ───────────────────
  const entries = fs.readdirSync(SANDBOXES_DIR, { withFileTypes: true });
  const boxes = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const metaPath = path.join(SANDBOXES_DIR, entry.name, 'metadata.json');
    const dockerfilePath = path.join(SANDBOXES_DIR, entry.name, 'Dockerfile');
    if (!fs.existsSync(metaPath) || !fs.existsSync(dockerfilePath)) continue;

    let metadata: SandboxMetadata;
    try {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch {
      console.log(`  ⚠️   metadata.json inválido en ${entry.name} — saltando`);
      continue;
    }

    const dockerImage = `onboardinghub/${entry.name}`;
    const data = {
      title: metadata.title,
      description: metadata.description,
      objectives: metadata.objectives,
      guide: metadata.guide || null,
      dockerImage,
      innerPort: metadata.innerPort,
      difficulty: metadata.difficulty,
      xpReward: metadata.xpReward,
    };

    let box = await prisma.box.findFirst({ where: { dockerImage } });

    if (!box) {
      box = await prisma.box.create({ data });
      console.log(`  ✅  Box creada: "${box.title}" (id: ${box.id})`);
    } else {
      box = await prisma.box.update({ where: { id: box.id }, data });
      console.log(`  ♻️   Box actualizada: "${box.title}" (id: ${box.id})`);
    }
    boxes.push(box);
  }

  if (boxes.length === 0) {
    console.log('  ⚠️   No se encontraron templates con metadata.json en docker/sandboxes/');
  }

  // ── 2. Asignar las Boxes a TODAS las empresas ───────────────────────────────
  const companies = await prisma.company.findMany();

  if (companies.length === 0) {
    console.log('  ⚠️   No hay empresas en la BD. Registra un usuario primero y vuelve a correr el seed.');
  } else {
    for (const company of companies) {
      for (const box of boxes) {
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
