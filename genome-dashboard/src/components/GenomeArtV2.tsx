import React, { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, Wand2 } from 'lucide-react';
import type { GenotypeEntry } from '../utils/genomeParser';

interface GenomeArtProps {
  entries: GenotypeEntry[];
  person: 'father' | 'mother' | 'son1' | 'son2';
  personName: string;
}

export const GenomeArtV2: React.FC<GenomeArtProps> = ({ entries, person, personName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqIdRef = useRef<number | null>(null);
  
  // V2: Dynamic Palettes based on genetics
  const [usePersonalColors, setUsePersonalColors] = useState(true);
  const [shape, setShape] = useState<'nebula' | 'star' | 'void'>('nebula');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateArt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
    }

    setIsGenerating(true);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    // Clear canvas to deep void
    ctx.fillStyle = '#020408'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    let x = cx;
    let y = cy;
    let currentChrom = '';

    // 1. DATA EXTRACTION (Variations Only)
    let personData = entries.map(e => {
        const g = e[person];
        if (!g || g.length === 0 || g === '--' || g === '__') return null;
        const isHet = g.length === 2 && g[0] !== g[1];
        if (!isHet) return null; // V2 is strict on differences
        return { allele: g[0], chrom: e.chromosome, pos: e.position };
    }).filter(Boolean) as { allele: string, chrom: string, pos: number }[];

    // 2. GENETIC SEED GENERATION (More complex hashing)
    let seedSum = 0;
    let chromSum = 0;
    personData.forEach((d, idx) => {
        // Mix position and index to create a pseudo-hash
        if (idx % 13 === 0) seedSum += d.pos;
        if (idx % 7 === 0) chromSum += parseInt(d.chrom) || 0;
    });
    
    const seed1 = (seedSum % 99991) / 99991; // Primary Chaos Factor
    const seed2 = (chromSum % 7919) / 7919;  // Secondary Color Factor
    
    // 3. DRASTIC GEOMETRY DISTORTION
    // Instead of fixed 90 degree angles, each person has unique "Attractor Points"
    // This morphs the shape from a circle to a unique polygon
    const warpAmount = 0.8; // How much the angles can shift (radians)
    
    const angleA = -Math.PI / 2 + (seed1 * warpAmount - warpAmount/2);
    const angleC = 0            + (seed2 * warpAmount - warpAmount/2);
    const angleG = Math.PI / 2  + (seed1 * warpAmount * -1); // Inverse shift
    const angleT = Math.PI      + (seed2 * warpAmount * -1);
    
    // Unique "Gravity" per base (Some people might be pulled more by 'A' than 'G')
    const pullA = 0.5 + (seed1 * 0.1 - 0.05);
    const pullC = 0.5 + (seed2 * 0.1 - 0.05);
    const pullG = 0.5 - (seed1 * 0.1 - 0.05);
    const pullT = 0.5 - (seed2 * 0.1 - 0.05);

    // 4. PERSONALIZED COLOR PALETTE
    // Generate 3 colors based on the seed
    const baseHue = Math.floor(seed1 * 360);
    const secHue = (baseHue + 120 + (seed2 * 60)) % 360; // Triadic-ish
    const terHue = (baseHue + 240 - (seed2 * 60)) % 360;
    
    // 5. RENDER LOOP
    let i = 0;
    const batchSize = 4000;

    const processBatch = () => {
      ctx.globalCompositeOperation = 'lighter'; // Maximum glow

      for (let j = 0; j < batchSize && i < personData.length; j++, i++) {
        const { allele, chrom } = personData[i];
        
        // Reset to center on chromosome change prevents "drifting off screen" 
        // due to weird gravity
        if (chrom !== currentChrom) {
            currentChrom = chrom;
            x = cx;
            y = cy;
        }

        // Determine Attractor Position
        let tx = 0, ty = 0;
        let pull = 0.5;

        switch (allele) {
            case 'A': 
                tx = cx + Math.cos(angleA) * radius; 
                ty = cy + Math.sin(angleA) * radius;
                pull = pullA;
                break;
            case 'C': 
                tx = cx + Math.cos(angleC) * radius; 
                ty = cy + Math.sin(angleC) * radius;
                pull = pullC;
                break;
            case 'G': 
                tx = cx + Math.cos(angleG) * radius; 
                ty = cy + Math.sin(angleG) * radius;
                pull = pullG;
                break;
            case 'T': 
                tx = cx + Math.cos(angleT) * radius; 
                ty = cy + Math.sin(angleT) * radius;
                pull = pullT;
                break;
            default: continue;
        }

        // Apply Chaos Game Move
        x = x + (tx - x) * pull;
        y = y + (ty - y) * pull;

        // COLORING
        let color = 'white';
        const chromNum = parseInt(chrom) || 0;
        
        if (usePersonalColors) {
            // Mix hues based on chromosome number and radial distance
            const dist = Math.sqrt((x - cx)**2 + (y - cy)**2) / radius;
            
            // Use different hues for different "arms" of the fractal
            let hue = baseHue;
            if (chromNum % 3 === 1) hue = secHue;
            if (chromNum % 3 === 2) hue = terHue;
            
            // Brightness varies by density/center
            const light = 40 + (dist * 40); 
            const alpha = 0.25;
            
            color = `hsla(${hue}, 80%, ${light}%, ${alpha})`;
        } else {
            // Fallback "Ice" theme
            const hue = 180 + (chromNum * 5);
            color = `hsla(${hue}, 70%, 60%, 0.3)`;
        }

        ctx.fillStyle = color;
        
        const size = 1.8;

        // GEOMETRY MODES
        if (shape === 'star') {
             // 5-fold symmetry
             const dx = x - cx;
             const dy = y - cy;
             const r = Math.sqrt(dx*dx + dy*dy);
             const theta = Math.atan2(dy, dx);
             for (let k = 0; k < 5; k++) {
                 const rot = theta + (k * Math.PI * 2 / 5);
                 ctx.fillRect(cx + r*Math.cos(rot), cy + r*Math.sin(rot), size, size);
             }
        } 
        else if (shape === 'void') {
             // Invert coordinates (push away from center)
             const dx = x - cx;
             const dy = y - cy;
             // Weird math to create a "black hole" effect
             const r = Math.sqrt(dx*dx + dy*dy);
             const newR = radius - r;
             const theta = Math.atan2(dy, dx);
             ctx.fillRect(cx + newR*Math.cos(theta), cy + newR*Math.sin(theta), size, size);
        }
        else {
             // Nebula (Standard) - Mirror for symmetry?
             // Let's do 2-fold symmetry for a "Rorschach" look
             ctx.fillRect(x, y, size, size);
             ctx.fillRect(width - x, y, size, size); // Horizontal Mirror
        }
      }

      if (i < personData.length) {
        reqIdRef.current = requestAnimationFrame(processBatch);
      } else {
        setIsGenerating(false);
        reqIdRef.current = null;
      }
    };

    reqIdRef.current = requestAnimationFrame(processBatch);
  };

  useEffect(() => {
    generateArt();
    return () => {
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
    };
  }, [entries, person, usePersonalColors, shape]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `genome_art_v2_${person}_${shape}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
            <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">
                    Genome Art V2: {personName}
                </h3>
                <span className="px-2 py-0.5 text-xs border border-gray-600 rounded bg-gray-800 text-gray-400">
                    Generative
                </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
                Unique Palette & Geometry generated from Heterozygous Seed.
            </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            <select 
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
                <option value="nebula">Rorschach Nebula</option>
                <option value="star">Star Cluster (5-Fold)</option>
                <option value="void">Void Inversion</option>
            </select>
            
            <button 
                onClick={() => setUsePersonalColors(!usePersonalColors)}
                className={`flex items-center px-3 py-1.5 rounded text-sm border transition-all ${
                    usePersonalColors 
                        ? 'bg-gradient-to-r from-purple-900 to-indigo-900 border-purple-500 text-purple-100' 
                        : 'bg-gray-800 border-gray-600 text-gray-400'
                }`}
            >
                <Wand2 className="w-4 h-4 mr-2" />
                {usePersonalColors ? 'Unique Colors' : 'Standard Colors'}
            </button>

            <button 
                onClick={generateArt} 
                disabled={isGenerating}
                className="p-2 text-gray-300 hover:bg-gray-800 rounded border border-gray-600 transition-colors"
                title="Regenerate"
            >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
                onClick={handleDownload}
                className="flex items-center px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium transition-colors"
            >
                <Download className="w-4 h-4 mr-2" /> Save HD
            </button>
        </div>
      </div>
      
      <div className="relative flex justify-center bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
        <canvas 
            ref={canvasRef} 
            width={1000} 
            height={1000} 
            className="max-w-full h-auto"
        />
        {isGenerating && (
            <div className="absolute bottom-4 right-4 text-xs text-white/50 animate-pulse">
                Generating...
            </div>
        )}
      </div>
    </div>
  );
};

