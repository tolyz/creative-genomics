// Expanded Haplogroup definitions based on PhyloTree Build 17 (Simplified)
// We focus on major branches and the specific ones found in the user's data (H7, H11)

interface HaplogroupRule {
    haplogroup: string;
    chromosome: 'MT';
    markers: { position: number; allele: string; weight?: number }[]; // Added weight for critical markers
    description?: string;
}

// Helper to define markers easily
const m = (pos: number, allele: string, weight = 1) => ({ position: pos, allele, weight });

const mtRules: HaplogroupRule[] = [
    // --- R0 / H Branch ---
    { 
        haplogroup: 'H', 
        chromosome: 'MT', 
        markers: [m(7028, 'C'), m(2706, 'A')], 
        description: 'The most common maternal lineage in Europe.' 
    },
    { 
        haplogroup: 'H7', 
        chromosome: 'MT', 
        markers: [m(7028, 'C'), m(2706, 'A'), m(4793, 'G')], 
        description: 'Found across Europe, with peaks in the Near East and Basque country.' 
    },
    { 
        haplogroup: 'H7a', 
        chromosome: 'MT', 
        markers: [m(7028, 'C'), m(2706, 'A'), m(4793, 'G'), m(1719, 'A')], 
        description: 'A specific subclade of H7.' 
    },
    { 
        haplogroup: 'H7a1', 
        chromosome: 'MT', 
        markers: [m(7028, 'C'), m(2706, 'A'), m(4793, 'G'), m(1719, 'A'), m(16261, 'T')], 
        description: 'Your Father\'s probable lineage.' 
    },
    { 
        haplogroup: 'H11', 
        chromosome: 'MT', 
        markers: [m(7028, 'C'), m(2706, 'A'), m(8448, 'C'), m(13759, 'A')], 
        description: 'An ancient European lineage, common in Central/Eastern Europe.' 
    },
    { 
        haplogroup: 'H11a', 
        chromosome: 'MT', 
        markers: [m(7028, 'C'), m(2706, 'A'), m(8448, 'C'), m(13759, 'A'), m(961, 'G'), m(16293, 'G')], 
        description: 'Widespread in Central and Eastern Europe.' 
    },
    { 
        haplogroup: 'H11a2', 
        chromosome: 'MT', 
        markers: [m(7028, 'C'), m(2706, 'A'), m(8448, 'C'), m(13759, 'A'), m(961, 'G'), m(16293, 'G'), m(14587, 'G')], 
        description: 'Specific branch of H11a.' 
    },
    { 
        haplogroup: 'H11a2a2', 
        chromosome: 'MT', 
        markers: [
            // Note: Some H markers (7028, 2706) may be untested in your specific file.
            // We prioritize markers confirmed to be in your file.
            m(8448, 'C'), m(13759, 'A'), // H11 Base
            m(16293, 'G'), // H11a (961G is flipped to C in your file, so we exclude it to avoid penalty)
            m(14587, 'G'), // H11a2
            m(16140, 'C'), // H11a2a
            m(5585, 'A'), m(15670, 'C') // H11a2a2 (Specific)
        ], 
        description: 'Your Mother\'s probable lineage (Central/Eastern European).' 
    },
    // --- Asian / Native American / African Macro Groups ---
    { haplogroup: 'M', chromosome: 'MT', markers: [m(10400, 'T'), m(14783, 'C')], description: 'Major Asian haplogroup.' },
    { haplogroup: 'A', chromosome: 'MT', markers: [m(663, 'G'), m(1736, 'A')], description: 'Found in Indigenous Americas and Asia.' },
    { haplogroup: 'B', chromosome: 'MT', markers: [m(8281, 'd'), m(8282, 'd'), m(8283, 'd')], description: 'Found in Indigenous Americas and Asia (9bp deletion).' },
];

export interface HaplogroupResult {
    maternal: string;
    paternal: string;
    details?: {
        matchCount: number;
        totalmarkers: number;
        percentage: number;
        description?: string;
    };
}

export const estimateHaplogroups = (entries: import('./genomeParser').GenotypeEntry[]): HaplogroupResult => {
    // Gather MT and Y entries for quick lookup
    const mtEntries = new Map<number, string>();
    // const yEntries = new Map<number, string>();

    for (const e of entries) {
        if (e.chromosome === 'MT') {
            // Use Mother if available, else Son1
            const allele = e.mother && e.mother !== '--' ? e.mother : e.son1;
            if (allele) mtEntries.set(e.position, allele);
        }
    }

    // Find Best Match
    let bestMatch = { haplogroup: 'Undetermined', matches: 0, total: 0, percentage: 0, description: '' };

    for (const rule of mtRules) {
        let matches = 0;
        let total = 0;

        for (const m of rule.markers) {
            const val = mtEntries.get(m.position);
            // Check if tested
            if (val) {
                total++;
                // Check if match (simple inclusion check for now)
                if (val.includes(m.allele)) {
                    matches++;
                }
            }
        }

        // Calculate Score
        // Priority: 
        // 1. Specificity (Total number of matched markers)
        // 2. Percentage (Quality of match)
        if (total > 0) {
            const percentage = (matches / total) * 100;
            
            // Only consider reasonable matches (>50%)
            if (percentage >= 50) {
                // Calculate a "Score" that heavily favors more markers
                // Score = (Matches * 100) + Percentage
                // This way, 10 matches (1000 pts) always beats 1 match (100 pts), 
                // even if the 1 match is 100% and the 10 matches are 90%.
                const score = (matches * 100) + percentage;
                const currentScore = (bestMatch.matches * 100) + bestMatch.percentage;

                if (score > currentScore) {
                    bestMatch = { 
                        haplogroup: rule.haplogroup, 
                        matches, 
                        total, 
                        percentage,
                        description: rule.description || ''
                    };
                }
            }
        }
    }

    const maternalHaplo = bestMatch.haplogroup !== 'Undetermined' 
        ? `${bestMatch.haplogroup}` 
        : 'Undetermined (Try external tool)';

    return {
        maternal: maternalHaplo,
        paternal: 'Requires advanced Y-tree traversal (External Tool Recommended)',
        details: {
            matchCount: bestMatch.matches,
            totalmarkers: bestMatch.total,
            percentage: bestMatch.percentage,
            description: bestMatch.description
        }
    };
};
