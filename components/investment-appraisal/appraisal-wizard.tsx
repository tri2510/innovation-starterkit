'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, FileText, TrendingUp, DollarSign, Zap, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AIChatInterface from './ai-chat-interface';
import FinancialSummary from './financial-summary';

interface Investment {
  id: string;
  name: string;
  tagline: string;
  description: string;
  businessModel?: string;
  revenueStreams?: string[];
  estimatedInvestment?: string;
  timeframe?: string;
}

interface InvestmentAppraisalWizardProps {
  investment: Investment;
  onBack: () => void;
}

type WizardStep = 'intro' | 'chat' | 'summary';

export default function InvestmentAppraisalWizard({ investment, onBack }: InvestmentAppraisalWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
  const [appraisalData, setAppraisalData] = useState<any>(null);
  const router = useRouter();

  const handleAppraisalComplete = (data: any) => {
    setAppraisalData(data);
    setCurrentStep('summary');
  };

  const handleExportAppraisal = () => {
    // Create a comprehensive appraisal document
    const appraisalDocument = {
      projectName: investment.name,
      tagline: investment.tagline,
      description: investment.description,
      appraisal: appraisalData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(appraisalDocument, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${investment.name.replace(/\s+/g, '-').toLowerCase()}-investment-appraisal.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleContinueToPitch = () => {
    // Store appraisal data and continue to pitch phase
    const appraisalWithMeta = {
      ...appraisalData,
      investmentId: investment.id,
      investmentName: investment.name,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem('investmentAppraisal', JSON.stringify(appraisalWithMeta));
    router.push('/pitch');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-slate-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Ideation
              </button>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <h1 className="text-xl font-bold text-white">Investment Appraisal</h1>
                <p className="text-sm text-slate-400">{investment.name}</p>
              </div>
            </div>
            
            {currentStep === 'summary' && (
              <div className="flex gap-3">
                <button
                  onClick={handleExportAppraisal}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Appraisal
                </button>
                <button
                  onClick={handleContinueToPitch}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
                >
                  Continue to Pitch
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {currentStep === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Investment Appraisal for {investment.name}
                </h2>
                <p className="text-slate-300 text-lg mb-6">
                  Build a comprehensive financial model with AI guidance through 6 essential sections:
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Users, title: 'Personnel Costs', desc: 'Team structure & salaries' },
                  { icon: DollarSign, title: 'Operating Expenses', desc: 'Running costs & overhead' },
                  { icon: TrendingUp, title: 'Capital Investments', desc: 'Equipment & infrastructure' },
                  { icon: FileText, title: 'Revenue Forecasts', desc: 'Income projections' },
                  { icon: Zap, title: 'Financial Analysis', desc: 'ROI, NPV & key metrics' },
                  { icon: CheckCircle2, title: 'Risk Assessment', desc: 'Viability & recommendations' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4 text-left"
                  >
                    <item.icon className="w-6 h-6 text-blue-400 mb-2" />
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep('chat')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all text-lg"
              >
                Start Investment Appraisal
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 'chat' && (
          <div className="h-[calc(100vh-200px)]">
            <AIChatInterface 
              investment={investment} 
              onComplete={handleAppraisalComplete}
            />
          </div>
        )}

        {currentStep === 'summary' && appraisalData && (
          <FinancialSummary 
            investment={investment}
            appraisalData={appraisalData}
            onEdit={() => setCurrentStep('chat')}
          />
        )}
      </div>
    </div>
  );
}

import { Users } from 'lucide-react';