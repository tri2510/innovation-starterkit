"use client";

import { useState } from "react";

export default function TestQueryGenerationPage() {
  const [selectedText, setSelectedText] = useState("TAM");
  const [industry, setIndustry] = useState("Retail Technology");
  const [audience, setAudience] = useState("Small retail businesses");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch("/api/test-query-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedText, industry, audience })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Test failed");
      }

      setResults(data);
      console.log("[Test Page] Results:", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("[Test Page] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Query Generation Test</h1>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Inputs</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Selected Text</label>
              <input
                type="text"
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Audience</label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            <button
              onClick={runTest}
              disabled={loading}
              className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Run Test"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Error</h3>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>

            <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <h3 className="font-medium mb-2">Configuration</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results.config, null, 2)}
              </pre>
            </div>

            <div className="space-y-4">
              {results.results.map((result: any, i: number) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{result.format}</h3>
                    {result.success !== undefined && (
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.success
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {result.success ? "SUCCESS" : "FAILED"}
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Prompt:</p>
                    <pre className="text-xs bg-slate-100 dark:bg-slate-700 p-2 rounded mt-1 whitespace-pre-wrap">
                      {result.prompt}
                    </pre>
                  </div>

                  {result.error ? (
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Error:</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{result.error}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Response:</p>
                      <div className={`p-2 rounded mt-1 ${
                        result.response
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      }`}>
                        <p className="text-sm font-mono">
                          {result.response ? `"${result.response}"` : "(empty)"}
                        </p>
                        {result.response && (
                          <p className="text-xs text-slate-500 mt-1">Length: {result.response.length} chars</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
