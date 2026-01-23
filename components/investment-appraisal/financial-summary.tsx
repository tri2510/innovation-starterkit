'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FinancialSummaryProps {
  investment: {
    name: string;
    tagline: string;
    description: string;
  };
  appraisalData: any;
  onEdit: () => void;
}

export default function FinancialSummary({ investment, appraisalData, onEdit }: FinancialSummaryProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getViabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{investment.name}</h2>
            <p className="text-slate-400">{investment.tagline}</p>
          </div>
          <button
            onClick={onEdit}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Edit Appraisal
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <MetricCard
          title="Net Present Value"
          value={formatCurrency(appraisalData.financialMetrics?.netPresentValue || 0)}
          icon={DollarSign}
          trend={appraisalData.financialMetrics?.netPresentValue > 0 ? 'up' : 'down'}
          color="blue"
        />
        <MetricCard
          title="Internal Rate of Return"
          value={formatPercentage(appraisalData.financialMetrics?.internalRateOfReturn || 0)}
          icon={TrendingUp}
          trend={appraisalData.financialMetrics?.internalRateOfReturn > 0.1 ? 'up' : 'down'}
          color="green"
        />
        <MetricCard
          title="Payback Period"
          value={`${appraisalData.financialMetrics?.paybackPeriod?.toFixed(1) || 0} years`}
          icon={Target}
          trend={appraisalData.financialMetrics?.paybackPeriod < 4 ? 'up' : 'down'}
          color="purple"
        />
        <MetricCard
          title="Viability Score"
          value={`${appraisalData.riskAssessment?.viabilityScore || 0}/100`}
          icon={CheckCircle2}
          trend={appraisalData.riskAssessment?.viabilityScore > 70 ? 'up' : 'down'}
          color="emerald"
        />
      </div>

      {/* Financial Projections */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">5-Year Financial Projections</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Metric</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">2026</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">2027</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">2028</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">2029</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">2030</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-white font-medium">Revenue</td>
                {appraisalData.revenueForecasts?.map((revenue: any, index: number) => (
                  <td key={index} className="text-right py-3 px-4 text-slate-300">
                    {formatCurrency(revenue.amount)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-white font-medium">Personnel Costs</td>
                {appraisalData.personnelCosts && [
                  appraisalData.personnelCosts.totalCost2026,
                  appraisalData.personnelCosts.totalCost2027,
                  appraisalData.personnelCosts.totalCost2028,
                  appraisalData.personnelCosts.totalCost2029,
                  appraisalData.personnelCosts.totalCost2030
                ].map((cost: any, index: number) => (
                  <td key={index} className="text-right py-3 px-4 text-slate-300">
                    {formatCurrency(cost || 0)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 px-4 text-white font-medium">ROI</td>
                {appraisalData.financialMetrics?.roiPercentage?.map((roi: number, index: number) => (
                  <td key={index} className={`text-right py-3 px-4 font-medium ${
                    roi > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(roi)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Personnel Structure */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Structure
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {appraisalData.personnelCosts?.levels?.map((level: any, index: number) => (
            <div key={index} className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Level {level.level}</span>
                <span className="text-slate-400 text-sm">Employees</span>
              </div>
              <div className="flex gap-2">
                {['2026', '2027', '2028', '2029', '2030'].map(year => (
                  <div key={year} className="text-center">
                    <div className="text-xs text-slate-400 mb-1">{year}</div>
                    <div className="bg-slate-700 rounded px-2 py-1 text-white text-sm font-medium">
                      {level[`count${year}`] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Risk Assessment & Recommendation
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-slate-400">Risk Level:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(appraisalData.riskAssessment?.riskLevel)}`}>
                {appraisalData.riskAssessment?.riskLevel?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Viability Score:</span>
              <span className={`text-2xl font-bold ${getViabilityColor(appraisalData.riskAssessment?.viabilityScore || 0)}`}>
                {appraisalData.riskAssessment?.viabilityScore || 0}/100
              </span>
            </div>
          </div>
          
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Recommendation</h4>
            <p className="text-slate-300 text-sm">
              {appraisalData.riskAssessment?.recommendation || 'No recommendation available.'}
            </p>
          </div>
        </div>
      </div>

      {/* Capital Investments */}
      {appraisalData.capexInvestments && appraisalData.capexInvestments.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Capital Investments</h3>
          <div className="space-y-3">
            {appraisalData.capexInvestments.map((capex: any, index: number) => (
              <div key={index} className="flex justify-between items-center bg-slate-700/30 rounded-lg p-4">
                <div className="text-white font-medium">{capex.year}</div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Investment</div>
                    <div className="text-blue-400 font-medium">{formatCurrency(capex.investment)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Depreciation</div>
                    <div className="text-slate-300 font-medium">{formatCurrency(capex.depreciation)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: any;
  trend: 'up' | 'down';
  color: 'blue' | 'green' | 'purple' | 'emerald';
}

function MetricCard({ title, value, icon: Icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
    green: 'bg-green-500/10 text-green-400 border-green-400/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-400/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/20'
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend === 'up' ? (
          <TrendingUp className="w-4 h-4 text-green-400" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400">{title}</div>
    </div>
  );
}