import React from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (content: string) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onDataLoaded(text);
    };
    reader.readAsText(file);
  };

  const loadDemo = async () => {
    try {
      const response = await fetch('/atpl.txt');
      const text = await response.text();
      onDataLoaded(text);
    } catch (error) {
      console.error("Failed to load demo data", error);
      alert("Failed to load demo data");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <Upload className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Genome Data</h3>
      <p className="text-gray-500 text-sm mb-4 text-center max-w-md">
        Upload your 23andMe-style raw data file (txt).
        <br />
        Format expected: rsID Chromosome Position Father Son1 Son2 Mother
      </p>
      
      <div className="flex gap-4">
        <label className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition-colors">
            {isLoading ? 'Processing...' : 'Select File'}
            <input 
                type="file" 
                accept=".txt" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isLoading}
            />
        </label>

        <button 
            onClick={loadDemo}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
            <FileText className="w-4 h-4" />
            Load Demo Data
        </button>
      </div>
    </div>
  );
};

