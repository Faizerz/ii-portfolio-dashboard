'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported?: number;
  holdings?: Array<{
    symbol: string;
    name: string;
    quantity: number;
    bookCost: number;
    marketValue: number;
  }>;
  errors?: string[];
  error?: string;
  details?: string;
}

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult({ success: false, error: 'Please upload a CSV file' });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          imported: data.imported,
          holdings: data.holdings,
          errors: data.errors,
        });
      } else {
        setResult({
          success: false,
          error: data.error,
          errors: data.errors,
          details: data.details,
        });
      }
    } catch {
      setResult({
        success: false,
        error: 'Failed to upload file. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      const response = await fetch('/api/clear-data', { method: 'POST' });
      if (response.ok) {
        setResult(null);
        setShowClearConfirm(false);
        window.location.href = '/';
      }
    } catch {
      // Ignore errors, just close the dialog
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Holdings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upload your portfolio statement from ii.co.uk
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to export from ii.co.uk</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Log in to your Interactive Investor account</li>
            <li>Go to your Portfolio page</li>
            <li>Click the download/export button (usually top-right)</li>
            <li>Select CSV format</li>
            <li>Upload the downloaded file below</li>
          </ol>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Processing file...</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-gray-500 dark:text-gray-400 mb-4">or</p>
                <label className="cursor-pointer inline-flex items-center justify-center font-medium rounded-lg transition-colors px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700">
                  Browse Files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            {result.success ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Import successful!
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Imported {result.imported} holdings
                    </p>
                  </div>
                </div>

                {result.holdings && result.holdings.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Fund</th>
                          <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">Book Cost</th>
                          <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">Market Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.holdings.map((h) => (
                          <tr key={h.symbol} className="border-b border-gray-100 dark:border-gray-700/50">
                            <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                              <div className="font-medium">{h.name}</div>
                              <div className="text-xs text-gray-500">{h.symbol}</div>
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">
                              {formatCurrency(h.bookCost)}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">
                              {formatCurrency(h.marketValue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="pt-4">
                  <a
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    View Portfolio
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    Import failed
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{result.error}</p>
                  {result.details && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 font-mono">{result.details}</p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clear Data Section */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Delete all data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Remove all holdings and cached price data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete all data?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will permanently delete all your holdings and cached price data.
              You will need to re-import your portfolio statement.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleClearData}
                disabled={isClearing}
              >
                {isClearing ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
