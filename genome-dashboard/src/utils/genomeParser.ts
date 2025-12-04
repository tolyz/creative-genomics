export interface GenotypeEntry {
  rsid: string;
  chromosome: string;
  position: number;
  father: string;
  son1: string;
  son2: string;
  mother: string;
}

export interface ParsedData {
  entries: GenotypeEntry[];
  metadata: {
    count: number;
    chromosomes: string[];
  };
}

export const parseGenomeData = (content: string): ParsedData => {
  const lines = content.split('\n');
  const entries: GenotypeEntry[] = [];
  const chromosomes = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    // Expecting: rsid chrom pos father son1 son2 mother (7 parts)
    if (parts.length < 7) continue;

    const [rsid, chromosome, positionStr, father, son1, son2, mother] = parts;
    
    // Basic cleaning of genotypes (e.g., "--" for no call)
    const clean = (g: string) => (g === '--' || g === '__' ? '' : g);

    const entry: GenotypeEntry = {
      rsid,
      chromosome,
      position: parseInt(positionStr, 10),
      father: clean(father),
      son1: clean(son1),
      son2: clean(son2),
      mother: clean(mother),
    };

    entries.push(entry);
    chromosomes.add(chromosome);
  }

  return {
    entries,
    metadata: {
      count: entries.length,
      chromosomes: Array.from(chromosomes),
    },
  };
};

