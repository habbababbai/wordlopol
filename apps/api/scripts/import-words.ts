import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { WORD_LENGTH } from '@wordlopol/shared';
import { PrismaClient } from '../src/generated/client.js';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const WORDS_PATH = resolve(process.cwd(), '../../data/words.txt');
const BATCH_SIZE = 500;

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ?? 'postgresql://wordlopol:wordlopol@localhost:5433/wordlopol',
});

const prisma = new PrismaClient({ adapter });

function loadWords(): string[] {
  const content = readFileSync(WORDS_PATH, 'utf-8');
  const seen = new Set<string>();
  const words: string[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const word = trimmed.toLowerCase();
    if (word.length !== WORD_LENGTH) continue;
    if (seen.has(word)) continue;

    seen.add(word);
    words.push(word);
  }

  return words;
}

async function main() {
  const words = loadWords();

  if (words.length === 0) {
    console.error('No valid 5-letter words found in data/words.txt');
    process.exit(1);
  }

  console.log(`Importing ${words.length} words...`);

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE).map((text) => ({
      text,
      length: WORD_LENGTH,
    }));

    await prisma.word.createMany({
      data: batch,
      skipDuplicates: true,
    });

    console.log(`  ${Math.min(i + BATCH_SIZE, words.length)} / ${words.length}`);
  }

  const total = await prisma.word.count();
  console.log(`Done. ${total} words in database.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
