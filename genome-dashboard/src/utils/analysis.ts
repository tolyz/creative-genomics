import type { GenotypeEntry } from './genomeParser';

export interface MendelianResult {
  totalSNPs: number;
  consistent: number;
  inconsistent: number;
  inconsistentEntries: GenotypeEntry[];
}

export interface SiblingComparison {
  totalSNPs: number;
  matches: number;
  matchPercentage: number;
}

export interface TraitDefinition {
  rsid: string;
  trait: string;
  description: string;
  riskAllele?: string;
  interpretation: (genotype: string) => string;
}

export const knownTraits: TraitDefinition[] = [
  {
    rsid: 'rs3093024',
    trait: 'Rheumatoid Arthritis Risk',
    description: 'Genetic variation associated with Rheumatoid Arthritis.',
    riskAllele: 'A',
    interpretation: (g) => {
      if (g.includes('A')) return 'Increased risk (A allele present)';
      return 'Typical risk';
    }
  },
  {
    rsid: 'rs744373',
    trait: 'Alzheimer\'s Disease Risk (BIN1)',
    description: 'Variant near BIN1 gene linked to late-onset Alzheimer\'s.',
    interpretation: (g) => {
        if (g.includes('G')) return 'Slightly increased risk (G allele)';
        return 'Typical risk (A allele)';
    }
  },
  {
    rsid: 'rs597668',
    trait: 'Alzheimer\'s Disease Risk (EXOC3L2)',
    description: 'Variant associated with late-onset Alzheimer\'s.',
    interpretation: (g) => {
      // According to Alzforum and other GWAS, the T allele is typically the risk allele for rs597668.
      // References usually cite T as the risk allele (or minor allele associated with risk).
      if (g.includes('T')) return 'Potential increased risk (T allele)';
      return 'Typical risk (C allele)';
    }
  },
  {
    rsid: 'rs2075650',
    trait: 'Longevity / Alzheimer\'s (TOMM40)',
    description: 'Associated with longevity and Alzheimer\'s risk (TOMM40 gene).',
    interpretation: (g) => {
        // rs2075650 G allele is often associated with Alzheimer's risk, A with longevity in some contexts
        if (g.includes('G')) return 'Potential increased Alzheimer\'s risk / lower longevity factor (G allele)';
        return 'Associated with longevity (A allele)';
    }
  },
  {
    rsid: 'rs10427255',
    trait: 'Photic Sneeze Reflex',
    description: 'Sneezing when exposed to bright light.',
    interpretation: (g) => {
        // C is the sneeze allele (dominant)
        if (g.includes('C')) return 'Likely has photic sneeze reflex (C allele)';
        return 'Likely does not have photic sneeze reflex (TT)';
    }
  },
  {
    rsid: 'rs4988235',
    trait: 'Lactose Intolerance (MCM6)',
    description: 'Predicts ability to digest milk as an adult.',
    interpretation: (g) => {
        // A is the lactase persistence allele (dominant)
        if (g.includes('A')) return 'Likely Lactose Tolerant (Can drink milk)';
        return 'Likely Lactose Intolerant';
    }
  },
  {
    rsid: 'rs12913832',
    trait: 'Eye Color (HERC2)',
    description: 'Strongly associated with blue vs. brown eyes.',
    interpretation: (g) => {
        // G (or C) is Blue, A (or T) is Brown. 
        // GG is likely Blue. AG/AA is likely Brown/Hazel.
        if (g === 'GG' || g === 'CC') return 'Likely Blue/Light Eyes';
        return 'Likely Brown/Hazel Eyes';
    }
  },
  {
    rsid: 'rs1815739',
    trait: 'Muscle Performance (ACTN3)',
    description: 'The "Sprinter" vs "Endurance" gene.',
    interpretation: (g) => {
        // C (R allele) = Power/Sprint. T (X allele) = Endurance.
        if (g === 'CC') return 'Power/Sprinter Type (RR)';
        if (g === 'CT') return 'Mixed Muscle Type (RX)';
        return 'Endurance Type (XX)';
    }
  },
  {
    rsid: 'rs762551',
    trait: 'Caffeine Metabolism (CYP1A2)',
    description: 'Speed of caffeine breakdown in the liver.',
    interpretation: (g) => {
        // A = Fast metabolizer. C = Slow metabolizer.
        if (g === 'AA') return 'Fast Metabolizer';
        return 'Slow Metabolizer';
    }
  },
  {
    rsid: 'rs671',
    trait: 'Alcohol Flush Reaction (ALDH2)',
    description: 'Asian flush reaction to alcohol.',
    interpretation: (g) => {
        // G is tolerant, A is flush.
        if (g.includes('A')) return 'Likely has Alcohol Flush Reaction';
        return 'Tolerant to Alcohol';
    }
  },
  {
    rsid: 'rs17822931',
    trait: 'Earwax Type (ABCC11)',
    description: 'Wet vs. Dry earwax type.',
    interpretation: (g) => {
        // C = Wet (Dominant). T = Dry (Recessive).
        if (g.includes('C')) return 'Wet Earwax';
        return 'Dry Earwax';
    }
  },
  {
    rsid: 'rs4680',
    trait: 'COMT (Warrior vs Worrier)',
    description: 'Dopamine breakdown rate affecting stress response.',
    interpretation: (g) => {
        // A (Met) = Low activity (High dopamine) -> Worrier
        // G (Val) = High activity (Low dopamine) -> Warrior
        if (g === 'AA') return 'Worrier (Higher Dopamine, Pain Sensitivity)';
        if (g === 'GG') return 'Warrior (Lower Dopamine, High Pain Threshold)';
        return 'Mixed (Intermediate)';
    }
  }
];

export const analyzeMendelianConsistency = (entries: GenotypeEntry[]): MendelianResult => {
  let consistent = 0;
  let inconsistent = 0;
  const inconsistentEntries: GenotypeEntry[] = [];

  // Autosomal only (1-22)
  const autosomal = entries.filter(e => 
    !['X', 'Y', 'MT'].includes(e.chromosome) && 
    !isNaN(parseInt(e.chromosome))
  );

  for (const entry of autosomal) {
    const { father, mother, son1, son2 } = entry;
    
    // Skip if any missing
    if (!father || !mother || !son1 || !son2) continue;
    if (father.length !== 2 || mother.length !== 2 || son1.length !== 2 || son2.length !== 2) continue;

    // Check Son 1
    if (!isConsistent(father, mother, son1)) {
      inconsistent++;
      inconsistentEntries.push(entry);
      continue;
    }
    
    // Check Son 2
    if (!isConsistent(father, mother, son2)) {
      inconsistent++;
      inconsistentEntries.push(entry);
      continue;
    }

    consistent++;
  }

  return {
    totalSNPs: consistent + inconsistent,
    consistent,
    inconsistent,
    inconsistentEntries
  };
};

const isConsistent = (father: string, mother: string, child: string): boolean => {
  const fAlleles = father.split('');
  const mAlleles = mother.split('');
  const cAlleles = child.split('');

  // Child must get one from Father and one from Mother
  // Try both permutations of child alleles
  
  // Case 1: c1 from F, c2 from M
  const c1FromF = fAlleles.includes(cAlleles[0]);
  const c2FromM = mAlleles.includes(cAlleles[1]);
  if (c1FromF && c2FromM) return true;

  // Case 2: c1 from M, c2 from F
  const c1FromM = mAlleles.includes(cAlleles[0]);
  const c2FromF = fAlleles.includes(cAlleles[1]);
  if (c1FromM && c2FromF) return true;

  return false;
};

export const analyzeMitochondrial = (entries: GenotypeEntry[]) => {
  const mtEntries = entries.filter(e => e.chromosome === 'MT');
  let matches = 0;
  let mismatches = 0;
  const mismatchedEntries: GenotypeEntry[] = [];

  for (const entry of mtEntries) {
    const { mother, son1, son2 } = entry;
    if (!mother || !son1 || !son2) continue;
    if (mother.length === 0 || son1.length === 0 || son2.length === 0) continue;

    if (mother === son1 && mother === son2) {
      matches++;
    } else {
      mismatches++;
      mismatchedEntries.push(entry);
    }
  }

  return {
    total: matches + mismatches,
    matches,
    mismatches,
    mismatchedEntries
  };
};

export const analyzeSiblingSharing = (entries: GenotypeEntry[]): SiblingComparison => {
    const autosomal = entries.filter(e => 
        !['X', 'Y', 'MT'].includes(e.chromosome) && 
        !isNaN(parseInt(e.chromosome))
    );

    let matches = 0;
    let total = 0;

    for (const entry of autosomal) {
        const { son1, son2 } = entry;
        if (!son1 || !son2 || son1.length !== 2 || son2.length !== 2) continue;

        // IBS Calculation (Identity By State)
        // 2 shared alleles = 100%
        // 1 shared allele = 50%
        // 0 shared alleles = 0%
        
        // Simplified "Percentage of shared alleles" as requested
        // Actually usually we calculate "IBS count".
        // If exact genotype match (AA vs AA) -> 2 shared.
        // AA vs AB -> 1 shared (A).
        // AA vs BB -> 0 shared.
        
        const s1 = son1.split('').sort();
        const s2 = son2.split('').sort();
        
        let shared = 0;
        const s2Copy = [...s2];
        
        // Check first allele of s1
        const idx1 = s2Copy.indexOf(s1[0]);
        if (idx1 !== -1) {
            shared++;
            s2Copy.splice(idx1, 1); // Remove used
        }
        
        // Check second allele of s1 against remaining s2
        if (s2Copy.includes(s1[1])) {
            shared++;
        }
        
        // shared is 0, 1, or 2.
        // To get "percentage of shared alleles" for the pair:
        // Total possible alleles = 2 per SNP.
        // But usually we report average genetic similarity. 
        // Full siblings: Expect 50% IBD (Identity By Descent), which corresponds to different IBS.
        // But prompt asks for "percentage of shared alleles".
        // I will average the (shared / 2).
        
        matches += (shared / 2);
        total++;
    }

    return {
        totalSNPs: total,
        matches, // This is sum of percentages (0, 0.5, 1)
        matchPercentage: total > 0 ? (matches / total) * 100 : 0
    };
};

export const analyzeTraits = (entries: GenotypeEntry[]) => {
    const results = [];
    for (const trait of knownTraits) {
        const entry = entries.find(e => e.rsid === trait.rsid);
        if (entry) {
            results.push({
                trait: trait.trait,
                rsid: trait.rsid,
                description: trait.description,
                genotypes: {
                    father: { genotype: entry.father, interpretation: trait.interpretation(entry.father) },
                    mother: { genotype: entry.mother, interpretation: trait.interpretation(entry.mother) },
                    son1: { genotype: entry.son1, interpretation: trait.interpretation(entry.son1) },
                    son2: { genotype: entry.son2, interpretation: trait.interpretation(entry.son2) },
                }
            });
        }
    }
    return results;
};

// --- Wellness & Lifestyle Definitions ---

export const wellnessTraits: TraitDefinition[] = [
  // Blood Type (ABO) - Simplified Proxy
  {
    rsid: 'rs8176746',
    trait: 'ABO Blood Group (B Allele)',
    description: 'Determines A vs B blood type (along with O deletion).',
    interpretation: (g) => {
      // A (T) = Type A, G = Type B (Reverse strand: T->A, C->G often seen)
      // Usually in 23andMe: 
      // AA/TT = Type A (assuming no O)
      // AC/TG = Type AB
      // CC/GG = Type B
      if (g.includes('G') || g.includes('C')) return 'Contains Type B variant';
      return 'Likely Type A (or O if deletion present)';
    }
  },
  // Note: O type is usually a deletion at rs8176719.
  // We will handle ABO logic specifically in the main function if possible, 
  // but here we list the raw SNPs for the generic trait viewer too.

  // Nutrigenomics
  {
    rsid: 'rs1801133',
    trait: 'MTHFR (Folate Metabolism)',
    description: 'Efficiency of processing folate/folic acid.',
    interpretation: (g) => {
      // T(A) is the risk allele.
      if (g === 'AA' || g === 'TT') return 'Reduced efficiency (~30-60%). Consider methylated B vitamins.';
      if (g === 'AG' || g === 'CT' || g === 'GA') return 'Slightly reduced efficiency (~80%).';
      return 'Normal folate metabolism.';
    }
  },
  {
    rsid: 'rs5082',
    trait: 'Saturated Fat Sensitivity (APOA2)',
    description: 'Weight gain response to saturated fat intake.',
    interpretation: (g) => {
      // CC = High risk of obesity with high saturated fat.
      // TT/TC = Normal risk.
      if (g === 'CC') return 'Sensitive to Saturated Fat (Limit intake).';
      return 'Normal Saturated Fat metabolism.';
    }
  },
  {
    rsid: 'rs9923231',
    trait: 'Warfarin Sensitivity (VKORC1)',
    description: 'Sensitivity to the blood thinner Warfarin.',
    interpretation: (g) => {
      // T = High sensitivity (Lower dose needed). C = Normal.
      // (AG/GA often seen as proxy). 
      // T allele is the sensitive one.
      if (g.includes('T') || g.includes('A')) return 'Increased Sensitivity (Lower dose may be required).';
      return 'Normal Sensitivity.';
    }
  },
  {
    rsid: 'rs4244285',
    trait: 'Clopidogrel (Plavix) Metabolism',
    description: 'Effectiveness of the heart drug Plavix.',
    interpretation: (g) => {
        // C = Poor metabolizer (Risk). T = Normal.
        if (g.includes('C')) return 'Likely Poor Metabolizer (Drug may be less effective).';
        return 'Normal Metabolism.';
    }
  },
  {
    rsid: 'rs72921001',
    trait: 'Cilantro Taste (OR6A2)',
    description: 'Does cilantro taste like soap?',
    interpretation: (g) => {
      // C = Soap taste.
      if (g.includes('C')) return 'Likely tastes like soap.';
      return 'Likely tastes herbal/fresh.';
    }
  },
  {
    rsid: 'rs2937573',
    trait: 'Misophonia Risk',
    description: 'Heightened sensitivity to chewing/eating sounds.',
    interpretation: (g) => {
      // G = Higher risk.
      if (g.includes('G')) return 'Higher likelihood of Misophonia.';
      return 'Typical sensitivity.';
    }
  },
  {
    rsid: 'rs4646',
    trait: 'Motion Sickness (CYP2D6)',
    description: 'Susceptibility to motion sickness.',
    interpretation: (g) => {
        // A = Higher susceptibility.
        if (g.includes('A')) return 'Likely susceptible to motion sickness.';
        return 'Typical susceptibility.';
    }
  },
  {
      rsid: 'rs1333049',
      trait: 'Asparagus Smell',
      description: 'Ability to smell "asparagus urine".',
      interpretation: (g) => {
          // G = Can smell it.
          if (g.includes('G')) return 'Can likely smell asparagus metabolites.';
          return 'Likely cannot smell it.';
      }
  },
  {
      rsid: 'rs4804148',
      trait: 'Neanderthal Variant (Immune)',
      description: 'A specific genetic marker inherited from Neanderthals (TLR1 gene).',
      interpretation: (g) => {
          // G = Neanderthal Allele.
          if (g.includes('G')) return 'Carries a Neanderthal variant (Associated with immune response).';
          return 'Modern human variant.';
      }
  },
  {
      rsid: 'rs16988151',
      trait: 'Neanderthal Variant (Skin/Hair)',
      description: 'Neanderthal marker associated with skin & hair traits (BNC2 gene).',
      interpretation: (g) => {
          // A = Neanderthal Allele.
          if (g.includes('A')) return 'Carries a Neanderthal variant (Associated with freckling/skin traits).';
          return 'Modern human variant.';
      }
  },
  {
      rsid: 'rs8176719',
      trait: 'Mosquito Magnet (Blood Type O)',
      description: 'People with Blood Type O are often found to be more attractive to mosquitoes.',
      interpretation: (g) => {
          // Deletion (-) or D indicates O allele.
          // Insertion (G) or I indicates A/B capable.
          // Note: 23andMe formats vary (--, DD, DI, -).
          if (g.includes('-') || g.includes('D')) return 'Likely Type O Allele (Higher Mosquito Attraction).';
          if (g.includes('G') || g.includes('I')) return 'Likely Type A/B/AB (Lower Mosquito Attraction).';
          return 'Genotype format unclear.';
      }
  }
];

export const analyzeWellness = (entries: GenotypeEntry[]) => {
    const results = [];
    for (const trait of wellnessTraits) {
        const entry = entries.find(e => e.rsid === trait.rsid);
        if (entry) {
            results.push({
                trait: trait.trait,
                rsid: trait.rsid,
                description: trait.description,
                genotypes: {
                    father: { genotype: entry.father, interpretation: trait.interpretation(entry.father) },
                    mother: { genotype: entry.mother, interpretation: trait.interpretation(entry.mother) },
                    son1: { genotype: entry.son1, interpretation: trait.interpretation(entry.son1) },
                    son2: { genotype: entry.son2, interpretation: trait.interpretation(entry.son2) },
                }
            });
        }
    }
    return results;
};
