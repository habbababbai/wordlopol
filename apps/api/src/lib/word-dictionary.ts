import { prisma } from './prisma.js';

export async function isWordInDictionary(text: string): Promise<boolean> {
  const word = await prisma.word.findUnique({ where: { text } });
  return word !== null;
}
