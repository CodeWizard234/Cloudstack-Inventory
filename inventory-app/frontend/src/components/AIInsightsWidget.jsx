import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

const AIInsightsWidget = () => {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/ai/insights');
        setInsights(res.data.insight);
      } catch (err) {
        console.error('Failed to fetch AI insights:', err);
        setError('Failed to load AI insights. Make sure the API key is configured.');
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  return (
    <div className="glass-card p-6 md:p-8 rounded-[24px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none w-64 h-64 -z-10 group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
          <Sparkles className="text-white w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">AI Inventory Assistant</h3>
          <p className="text-xs text-slate-500 font-medium">Powered by Google Gemini</p>
        </div>
      </div>

      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
        {loading ? (
          <div className="flex items-center gap-3 text-indigo-600 font-medium">
            <Loader2 className="animate-spin w-5 h-5" />
            Generating deep insights from your stock data...
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 text-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsWidget;