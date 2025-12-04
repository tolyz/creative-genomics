import React, { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import type { GenotypeEntry } from '../utils/genomeParser';

interface GenomeArtProps {
  entries: GenotypeEntry[];
  person: 'father' | 'mother' | 'son1' | 'son2';
  personName: string;
}

export const GenomeArtV1: React.FC<GenomeArtProps> = ({ entries, person, personName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reqIdRef = useRef<number | null>(null);
  const [colorScheme, setColorScheme] = useState<'chromosome' | 'density' | 'mono' | 'nebula' | 'fire' | 'ocean'>('nebula');
  const [shape, setShape] = useState<'square' | 'circle' | 'snowflake'>('snowflake');
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

    // Reset composite operation to default for clearing
    ctx.globalCompositeOperation = 'source-over';
    // Clear canvas
    ctx.fillStyle = '#050b14'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    let x = cx;
    let y = cy;
    let currentChrom = '';

    // Get specific person's data
    // ONLY KEEP HETEROZYGOUS VARIANTS
    let personData = entries.map(e => {
        const g = e[person];
        if (!g || g.length === 0 || g === '--' || g === '__') return null;
        const isHet = g.length === 2 && g[0] !== g[1];
        // If not heterozygous, skip immediately
        if (!isHet) return null;
        
        return { allele: g[0], chrom: e.chromosome, pos: e.position };
    }).filter(Boolean) as { allele: string, chrom: string, pos: number }[];

    // Calculate Unique "Seed" Factor from heterozygous positions
    let seedSum = 0;
    for(let k = 0; k < personData.length; k += 50) {
        seedSum += personData[k].pos;
    }
    // Normalize to 0.0 - 1.0
    const uniqueSeed = (seedSum % 100000) / 100000; 
    
    // DYNAMIC GEOMETRY FACTORS based on seed
    const rotationOffset = uniqueSeed * Math.PI * 2; 
    const jumpFactor = 0.48 + (uniqueSeed * 0.06); 
    const hueShift = Math.floor(uniqueSeed * 360);

    let i = 0;
    const batchSize = 4000; // Smaller batch since fewer points

    const processBatch = () => {
      ctx.globalCompositeOperation = 'lighter';

      for (let j = 0; j < batchSize && i < personData.length; j++, i++) {
        const { allele, chrom } = personData[i];
        
        if (chrom !== currentChrom) {
            currentChrom = chrom;
            x = cx;
            y = cy;
        }

        let tx = 0, ty = 0;

        if (shape === 'square') {
             // Square Corners
            switch (allele) {
                case 'A': tx = 0; ty = 0; break;
                case 'C': tx = width; ty = 0; break;
                case 'G': tx = width; ty = height; break;
                case 'T': tx = 0; ty = height; break;
                default: continue; 
            }
            x = x + (tx - x) * jumpFactor;
            y = y + (ty - y) * jumpFactor;

        } else {
            // Circle / Snowflake Attractors
            let angle = 0;
            switch (allele) {
                case 'A': angle = -Math.PI / 2; break; 
                case 'C': angle = 0; break;            
                case 'G': angle = Math.PI / 2; break;  
                case 'T': angle = Math.PI; break;      
                default: continue;
            }
            
            angle += rotationOffset;

            const tx = cx + Math.cos(angle) * radius;
            const ty = cy + Math.sin(angle) * radius;

            x = x + (tx - x) * jumpFactor;
            y = y + (ty - y) * jumpFactor;
        }

        // Color Logic
        let color = `rgba(255, 255, 255, 0.3)`;
        const chromNum = parseInt(chrom) || (chrom === 'X' ? 23 : chrom === 'Y' ? 24 : chrom === 'MT' ? 25 : 0);

        switch (colorScheme) {
            case 'chromosome':
                const hue = (chromNum * 15 + hueShift) % 360;
                color = `hsla(${hue}, 80%, 60%, 0.6)`; 
                break;
            case 'density':
                color = `rgba(100, 200, 255, 0.3)`;
                break;
            case 'nebula':
                const dist = Math.sqrt((x - cx)**2 + (y - cy)**2) / radius;
                const r = 255 * (1 - dist);
                const g = 50;
                const b = 255 * dist;
                color = `rgba(${r}, ${g}, ${b}, 0.3)`; 
                break;
            case 'fire':
                 color = `rgba(255, ${Math.random() * 150}, 0, 0.4)`;
                 break;
            case 'ocean':
                 color = `rgba(0, ${150 + Math.random() * 100}, ${200 + Math.random() * 55}, 0.4)`;
                 break;
            case 'mono':
                color = `rgba(255, 255, 255, 0.25)`;
                break;
        }

        ctx.fillStyle = color;
        const size = 2.0; // Fixed size for Variations Only

        // DRAWING LOGIC
        if (shape === 'snowflake') {
            // 6-fold Symmetry (Kaleidoscope)
            const dx = x - cx;
            const dy = y - cy;
            const r = Math.sqrt(dx*dx + dy*dy);
            const theta = Math.atan2(dy, dx);
            
            // Draw 6 copies rotated by 60 degrees
            for (let k = 0; k < 6; k++) {
                const rotAngle = theta + (k * Math.PI / 3);
                const drawX = cx + r * Math.cos(rotAngle);
                const drawY = cy + r * Math.sin(rotAngle);
                ctx.fillRect(drawX, drawY, size, size);
            }
        } else {
            // Standard Draw
            ctx.fillRect(x, y, size, size); 
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
        if (reqIdRef.current) {
            cancelAnimationFrame(reqIdRef.current);
        }
    };
  }, [entries, person, colorScheme, shape]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `genome_art_${person}_${shape}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div>
            <h3 className="text-lg font-bold text-gray-900">Genetic Fractal: {personName}</h3>
            <p className="text-sm text-gray-500">
                Visualizing DNA using Chaos Game Representation (CGR). 
                Patterns emerge from the biological structure of the genome.
            </p>
        </div>
        <div className="flex flex-wrap gap-2">
            <select 
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm bg-gray-50"
            >
                <option value="circle">Circular (Mandala)</option>
                <option value="snowflake">Snowflake (Hexagonal)</option>
                <option value="square">Square (Classic)</option>
            </select>
            <select 
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm bg-gray-50"
            >
                <option value="nebula">Nebula (Pink/Blue)</option>
                <option value="fire">Fire (Red/Orange)</option>
                <option value="ocean">Ocean (Blue/Teal)</option>
                <option value="chromosome">Chromosome Colors</option>
                <option value="density">Blue Density</option>
                <option value="mono">Monochrome</option>
            </select>
            <button 
                onClick={generateArt} 
                disabled={isGenerating}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded border"
                title="Regenerate"
            >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
            <button 
                onClick={handleDownload}
                className="flex items-center px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
                <Download className="w-4 h-4 mr-2" /> Save Art
            </button>
        </div>
      </div>
      
      <div className="flex justify-center bg-black rounded-lg p-4 overflow-hidden shadow-inner">
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={800} 
            className="max-w-full h-auto rounded-full shadow-2xl border-4 border-gray-800"
            style={{ borderRadius: shape === 'circle' ? '50%' : '4px' }}
        />
      </div>
      <div className="mt-4 text-xs text-center text-gray-500">
        {shape === 'circle' 
            ? "A (Top) • C (Right) • G (Bottom) • T (Left)" 
            : "A (Top-Left) • C (Top-Right) • G (Bottom-Right) • T (Bottom-Left)"}
      </div>
    </div>
  );
};

