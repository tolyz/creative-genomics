import React, { useMemo, useState } from 'react';
import type { ParsedData } from '../utils/genomeParser';
import { 
  analyzeMendelianConsistency, 
  analyzeMitochondrial, 
  analyzeSiblingSharing, 
  analyzeTraits,
  analyzeWellness
} from '../utils/analysis';
import { estimateHaplogroups } from '../utils/haplogroup';
import { exportTo23andMe } from '../utils/exporter';
import { Card } from './Card';
import { GenomeArt } from './GenomeArt';
import { AlertTriangle, CheckCircle, Dna, Users, Activity, Globe, Download, Edit2, Save, Palette } from 'lucide-react';

interface DashboardProps {
  data: ParsedData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'family' | 'traits' | 'wellness' | 'ancestry' | 'art'>('family');
  const [manualMaternal, setManualMaternal] = useState<string>('');
  const [manualPaternal, setManualPaternal] = useState<string>('');
  const [editingMaternal, setEditingMaternal] = useState(false);
  const [editingPaternal, setEditingPaternal] = useState(false);
  
  // State for Art Tab Selection
  const [artPerson, setArtPerson] = useState<'father' | 'mother' | 'son1' | 'son2'>('father');

  const mendelian = useMemo(() => analyzeMendelianConsistency(data.entries), [data]);
  const mitochondrial = useMemo(() => analyzeMitochondrial(data.entries), [data]);
  const sibling = useMemo(() => analyzeSiblingSharing(data.entries), [data]);
  const traits = useMemo(() => analyzeTraits(data.entries), [data]);
  const wellness = useMemo(() => analyzeWellness(data.entries), [data]);
  const haplogroups = useMemo(() => estimateHaplogroups(data.entries), [data]);

  const handleDownload = (person: 'mother' | 'father' | 'son1' | 'son2') => {
      const content = exportTo23andMe(data.entries, person);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `23andme_format_${person}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  // Error rate percentage for Mendelian consistency
  const errorRate = (mendelian.inconsistent / mendelian.totalSNPs) * 100;
  const isHighError = errorRate > 1.0; // Warn if > 1%

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center">
            <Dna className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total SNPs Processed</p>
              <p className="text-2xl font-bold">{data.metadata.count.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Sibling Similarity</p>
              <p className="text-2xl font-bold">{sibling.matchPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Traits Identified</p>
              <p className="text-2xl font-bold">{traits.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('family')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'family'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Family Analysis
          </button>
          <button
            onClick={() => setActiveTab('traits')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'traits'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Health & Traits
          </button>
          <button
            onClick={() => setActiveTab('wellness')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wellness'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Wellness & Lifestyle
          </button>
          <button
            onClick={() => setActiveTab('ancestry')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ancestry'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ancestry (Haplogroups)
          </button>
          <button
            onClick={() => setActiveTab('art')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'art'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Genome Art
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'family' && (
        <div className="space-y-6">
          <Card title="Mendelian Consistency (Autosomal)">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p className="text-gray-600">
                  Checks if children's alleles are consistent with parents (Father & Mother).
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">
                  {((mendelian.consistent / mendelian.totalSNPs) * 100).toFixed(2)}%
                </span>
                <span className="text-sm text-gray-500 block">Consistency Rate</span>
              </div>
            </div>
            <div className="bg-gray-100 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className={`h-2.5 rounded-full ${isHighError ? 'bg-yellow-500' : 'bg-green-600'}`}
                style={{ width: `${(mendelian.consistent / mendelian.totalSNPs) * 100}%` }}
              ></div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {mendelian.inconsistent.toLocaleString()} inconsistencies found out of {mendelian.totalSNPs.toLocaleString()} SNPs checked.
            </div>
            
            {mendelian.inconsistent > 0 && (
                <div className={`mt-4 p-4 rounded-md border ${isHighError ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <h4 className={`font-semibold flex items-center ${isHighError ? 'text-yellow-800' : 'text-green-800'}`}>
                        {isHighError ? <AlertTriangle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        {isHighError ? 'Potential Issues' : 'Excellent Consistency'}
                    </h4>
                    <p className={`mt-1 ${isHighError ? 'text-yellow-700' : 'text-green-700'}`}>
                        {isHighError 
                            ? 'A higher than expected number of inconsistencies found (>1%). This may indicate sample mix-ups or low quality data.' 
                            : 'The low number of inconsistencies (<1%) is typical for high-quality genotyping and confirms a true parent-child relationship.'}
                    </p>
                </div>
            )}
          </Card>

          <Card title="Mitochondrial DNA (Maternal Lineage)">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-gray-600">Verifies that Sons match Mother's mtDNA.</p>
                </div>
                <div className="flex items-center">
                    {mitochondrial.mismatches === 0 ? (
                        <span className="flex items-center text-green-600 font-medium">
                            <CheckCircle className="w-5 h-5 mr-1" /> Matches Exactly
                        </span>
                    ) : (
                        <span className="flex items-center text-red-600 font-medium">
                            <AlertTriangle className="w-5 h-5 mr-1" /> {mitochondrial.mismatches} Mismatches
                        </span>
                    )}
                </div>
            </div>
            <p className="text-sm text-gray-500">
                Analyzed {mitochondrial.total} mtDNA markers. 
                Matches: {mitochondrial.matches}. 
                Mismatches: {mitochondrial.mismatches}.
            </p>
          </Card>

          <Card title="Sibling Comparison">
              <p className="text-gray-600 mb-4">
                  Measures allele sharing (Identity By State). For full siblings, 
                  this is typically <strong>80-90%</strong> (unlike IBD which is ~50%).
              </p>
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                      <p className="text-4xl font-bold text-indigo-600">{sibling.matchPercentage.toFixed(1)}%</p>
                      <p className="text-gray-500 mt-2">Allele Similarity (IBS)</p>
                  </div>
              </div>
          </Card>
        </div>
      )}

      {activeTab === 'traits' && (
        <div className="grid grid-cols-1 gap-4">
            {traits.map((t) => (
                <Card key={t.rsid} title={`${t.trait} (${t.rsid})`}>
                    <p className="text-gray-600 mb-4">{t.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-gray-50 rounded">
                            <span className="block font-semibold text-gray-500">Father</span>
                            <span className="block text-lg font-medium">{t.genotypes.father.genotype || '--'}</span>
                            <span className="block text-xs text-gray-400">{t.genotypes.father.interpretation}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <span className="block font-semibold text-gray-500">Mother</span>
                            <span className="block text-lg font-medium">{t.genotypes.mother.genotype || '--'}</span>
                            <span className="block text-xs text-gray-400">{t.genotypes.mother.interpretation}</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded border border-blue-100">
                            <span className="block font-semibold text-blue-500">Son 1</span>
                            <span className="block text-lg font-medium">{t.genotypes.son1.genotype || '--'}</span>
                            <span className="block text-xs text-gray-500">{t.genotypes.son1.interpretation}</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded border border-blue-100">
                            <span className="block font-semibold text-blue-500">Son 2</span>
                            <span className="block text-lg font-medium">{t.genotypes.son2.genotype || '--'}</span>
                            <span className="block text-xs text-gray-500">{t.genotypes.son2.interpretation}</span>
                        </div>
                    </div>
                </Card>
            ))}
            {traits.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    No specific trait SNPs found in this dataset.
                </div>
            )}
        </div>
      )}

      {activeTab === 'wellness' && (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Activity className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> These results are based on specific genetic markers and are for educational/entertainment purposes only. 
                            They are not medical diagnoses. Consult a healthcare professional for medical advice.
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {wellness.map((t) => (
                    <Card key={t.rsid} title={`${t.trait} (${t.rsid})`}>
                        <p className="text-gray-600 mb-4">{t.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 bg-gray-50 rounded">
                                <span className="block font-semibold text-gray-500">Father</span>
                                <span className="block text-lg font-medium">{t.genotypes.father.genotype || '--'}</span>
                                <span className="block text-xs text-gray-400">{t.genotypes.father.interpretation}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded">
                                <span className="block font-semibold text-gray-500">Mother</span>
                                <span className="block text-lg font-medium">{t.genotypes.mother.genotype || '--'}</span>
                                <span className="block text-xs text-gray-400">{t.genotypes.mother.interpretation}</span>
                            </div>
                            <div className="p-3 bg-blue-50 rounded border border-blue-100">
                                <span className="block font-semibold text-blue-500">Son 1</span>
                                <span className="block text-lg font-medium">{t.genotypes.son1.genotype || '--'}</span>
                                <span className="block text-xs text-gray-500">{t.genotypes.son1.interpretation}</span>
                            </div>
                            <div className="p-3 bg-blue-50 rounded border border-blue-100">
                                <span className="block font-semibold text-blue-500">Son 2</span>
                                <span className="block text-lg font-medium">{t.genotypes.son2.genotype || '--'}</span>
                                <span className="block text-xs text-gray-500">{t.genotypes.son2.interpretation}</span>
                            </div>
                        </div>
                    </Card>
                ))}
                {wellness.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No wellness-related SNPs found in this dataset.
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'ancestry' && (
          <div className="space-y-6">
              <Card title="Maternal Haplogroup (mtDNA)">
                  <div className="flex items-start">
                      <Globe className="w-12 h-12 text-pink-500 mr-4 flex-shrink-0" />
                      <div className="flex-1">
                          {editingMaternal ? (
                              <div className="flex items-center gap-2 mb-2">
                                  <input 
                                      type="text" 
                                      value={manualMaternal}
                                      onChange={(e) => setManualMaternal(e.target.value)}
                                      placeholder="Enter result (e.g. H11a2a2)"
                                      className="border rounded px-3 py-2 w-full max-w-xs"
                                      autoFocus
                                  />
                                  <button 
                                      onClick={() => setEditingMaternal(false)}
                                      className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                      title="Save"
                                  >
                                      <Save className="w-5 h-5" />
                                  </button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-bold text-gray-900">
                                      {manualMaternal || haplogroups.maternal}
                                  </h4>
                                  {manualMaternal && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Manual</span>
                                  )}
                                  <button 
                                      onClick={() => {
                                          if (!manualMaternal) setManualMaternal(haplogroups.maternal);
                                          setEditingMaternal(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                                      title="Edit / Override Result"
                                  >
                                      <Edit2 className="w-4 h-4" />
                                  </button>
                              </div>
                          )}
                          
                          {!editingMaternal && (
                              <>
                                  {haplogroups.details && haplogroups.details.description && !manualMaternal && (
                                      <p className="text-sm text-gray-700 mt-1 font-medium">
                                          {haplogroups.details.description}
                                      </p>
                                  )}
                                  <p className="text-gray-600 mt-2 text-sm">
                                      {manualMaternal 
                                          ? "Result manually entered from external tool."
                                          : `Based on ${haplogroups.details?.matchCount || 0} matching markers (Confidence: ${(haplogroups.details?.percentage || 0).toFixed(0)}%).`
                                      }
                                      <br/>
                                      <span className="text-xs text-gray-500">
                                          This tool checks for major lineages (H, U, J, T, K, etc.). 
                                          For precise subclades, use <a href="https://dna.jameslick.com/mthap/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">James Lick's mtHap</a>.
                                      </span>
                                  </p>
                              </>
                          )}
                      </div>
                  </div>
              </Card>

              <Card title="Paternal Haplogroup (Y-DNA)">
                  <div className="flex items-start">
                      <Globe className="w-12 h-12 text-blue-500 mr-4 flex-shrink-0" />
                      <div className="flex-1">
                          {editingPaternal ? (
                              <div className="flex items-center gap-2 mb-2">
                                  <input 
                                      type="text" 
                                      value={manualPaternal}
                                      onChange={(e) => setManualPaternal(e.target.value)}
                                      placeholder="Enter result (e.g. R1b...)"
                                      className="border rounded px-3 py-2 w-full max-w-xs"
                                      autoFocus
                                  />
                                  <button 
                                      onClick={() => setEditingPaternal(false)}
                                      className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                                      title="Save"
                                  >
                                      <Save className="w-5 h-5" />
                                  </button>
                              </div>
                          ) : (
                              <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-bold text-gray-900">
                                      {manualPaternal || haplogroups.paternal}
                                  </h4>
                                  {manualPaternal && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Manual</span>
                                  )}
                                  <button 
                                      onClick={() => {
                                          if (!manualPaternal) setManualPaternal(haplogroups.paternal === 'Undetermined (Y-DNA)' ? '' : haplogroups.paternal);
                                          setEditingPaternal(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                                      title="Edit / Override Result"
                                  >
                                      <Edit2 className="w-4 h-4" />
                                  </button>
                              </div>
                          )}

                          {!editingPaternal && (
                              <p className="text-gray-600 mt-2">
                                  {manualPaternal 
                                    ? "Result manually entered from external tool." 
                                    : "Y-DNA haplogrouping requires external tools."
                                  }
                                  <br/>
                                  {!manualPaternal && (
                                      <>
                                      We recommend uploading your raw Y-DNA data (Father or Sons) to 
                                      <a href="https://cladefinder.yseq.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">YSEQ Cladefinder</a>.
                                      </>
                                  )}
                              </p>
                          )}
                      </div>
                  </div>
              </Card>

              <Card title="Download Formatted Raw Data">
                  <p className="text-gray-600 mb-4">
                      Need to upload your data to James Lick's mtHap, GEDmatch, or other tools? 
                      Download individual files in the standard 23andMe format below.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button onClick={() => handleDownload('father')} className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                          <Download className="w-4 h-4 mr-2" /> Father
                      </button>
                      <button onClick={() => handleDownload('mother')} className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                          <Download className="w-4 h-4 mr-2" /> Mother
                      </button>
                      <button onClick={() => handleDownload('son1')} className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                          <Download className="w-4 h-4 mr-2" /> Son 1
                      </button>
                      <button onClick={() => handleDownload('son2')} className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                          <Download className="w-4 h-4 mr-2" /> Son 2
                      </button>
                  </div>
              </Card>
          </div>
      )}

      {activeTab === 'art' && (
          <div className="space-y-6">
              <Card>
                  <div className="flex items-center mb-4">
                      <Palette className="w-6 h-6 text-purple-500 mr-2" />
                      <h3 className="text-lg font-medium">Select Person</h3>
                  </div>
                  <div className="flex space-x-4">
                      {(['father', 'mother', 'son1', 'son2'] as const).map((p) => (
                          <button
                              key={p}
                              onClick={() => setArtPerson(p)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  artPerson === p 
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                      ))}
                  </div>
              </Card>
              
              <GenomeArt 
                  entries={data.entries} 
                  person={artPerson} 
                  personName={artPerson.charAt(0).toUpperCase() + artPerson.slice(1)} 
              />
          </div>
      )}
    </div>
  );
};
