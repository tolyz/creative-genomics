import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseGenomeData, type ParsedData } from './utils/genomeParser';
import { Dna } from 'lucide-react';

function App() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDataLoaded = (content: string) => {
    setLoading(true);
    // Use setTimeout to allow UI to update before heavy processing
    setTimeout(() => {
      try {
        const parsed = parseGenomeData(content);
        setData(parsed);
      } catch (error) {
        console.error("Parsing error", error);
        alert("Failed to parse file.");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Dna className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Genome Family Dashboard</span>
            </div>
            {data && (
                <button 
                    onClick={() => setData(null)}
                    className="self-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Upload New File
                </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data ? (
          <div className="max-w-xl mx-auto mt-10">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900">Analyze Your Family Genomes</h2>
                <p className="mt-4 text-lg text-gray-500">
                    Upload a multi-sample 23andMe raw data file to explore inheritance, relationships, and traits.
                </p>
            </div>
            <FileUpload onDataLoaded={handleDataLoaded} isLoading={loading} />
          </div>
        ) : (
          <Dashboard data={data} />
        )}
      </main>
    </div>
  );
}

export default App;
