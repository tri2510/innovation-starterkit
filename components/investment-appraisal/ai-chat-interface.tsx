'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, TrendingUp, Users, DollarSign, Zap, CheckCircle2 } from 'lucide-react';
import { streamChatResponse } from '@/hooks/use-chat-streaming';
import { AppraisalProgress } from '@/lib/types/investment-appraisal';
import { INVESTMENT_APPRAISAL_PROMPT } from '@/lib/prompts-clean';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  progressUpdate?: AppraisalProgress;
}

interface Investment {
  id: string;
  name: string;
  tagline: string;
  description: string;
}

interface AIChatInterfaceProps {
  investment: Investment;
  onComplete: (appraisal: any) => void;
}

export default function AIChatInterface({ investment, onComplete }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: `Welcome to the Investment Appraisal for "${investment.name}"! 

I'll help you build a comprehensive financial model through 6 key sections:
1. 👥 **Personnel Costs** - Team structure & salaries
2. 💼 **Operating Expenses** - Running costs & overhead
3. 🏗️ **Capital Investments** - Equipment & infrastructure
4. 📈 **Revenue Forecasts** - Income projections
5. 💰 **Financial Analysis** - ROI, NPV & key metrics
6. ⚠️ **Risk Assessment** - Viability & recommendations

Let's start! Tell me about your team structure - how many people do you need and what roles?`,
    timestamp: new Date()
  }]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<AppraisalProgress>({
    currentSection: 'intro',
    completedSections: [],
    totalSections: 6,
    progressPercentage: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractProgressUpdate = (content: string): AppraisalProgress | null => {
    const progressRegex = /PROGRESS_UPDATE:\s*({[^}]+})/;
    const match = content.match(progressRegex);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error('Failed to parse progress update:', e);
      }
    }
    return null;
  };

  const extractFinalSummary = (content: string): any | null => {
    const summaryRegex = /```json\s*\n?\s*({[\s\S]*?"FINAL_SUMMARY"[\s\S]*?})\s*```/;
    const match = content.match(summaryRegex);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        return parsed.FINAL_SUMMARY;
      } catch (e) {
        console.error('Failed to parse final summary:', e);
      }
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai/investment-appraisal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          investment,
          systemPrompt: INVESTMENT_APPRAISAL_PROMPT,
          currentProgress
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantContent += chunk;
        }
      }

      const progressUpdate = extractProgressUpdate(assistantContent);
      const finalSummary = extractFinalSummary(assistantContent);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent.replace(/PROGRESS_UPDATE:\s*{[^}]+}/, '').trim(),
        timestamp: new Date(),
        progressUpdate: progressUpdate || undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (progressUpdate) {
        setCurrentProgress(progressUpdate);
      }

      if (finalSummary) {
        onComplete(finalSummary);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const sectionIcons: Record<string, any> = {
    personnel_costs: Users,
    operating_expenses: DollarSign,
    capital_investments: TrendingUp,
    revenue_forecasts: TrendingUp,
    financial_analysis: Zap,
    risk_assessment: CheckCircle2
  };

  const getSectionName = (section: string): string => {
    const names: Record<string, string> = {
      personnel_costs: 'Personnel Costs',
      operating_expenses: 'Operating Expenses', 
      capital_investments: 'Capital Investments',
      revenue_forecasts: 'Revenue Forecasts',
      financial_analysis: 'Financial Analysis',
      risk_assessment: 'Risk Assessment'
    };
    return names[section] || section;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Progress Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-blue-500/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold">Investment Appraisal</h2>
            </div>
            <div className="text-blue-300 text-sm font-medium">
              {currentProgress.progressPercentage}% Complete
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-blue-900/30 rounded-full h-2 mb-3">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress.progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Section Progress */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['personnel_costs', 'operating_expenses', 'capital_investments', 'revenue_forecasts', 'financial_analysis', 'risk_assessment'].map((section) => {
              const Icon = sectionIcons[section];
              const isComplete = currentProgress.completedSections.includes(section);
              const isCurrent = currentProgress.currentSection === section;
              
              return (
                <motion.div
                  key={section}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    isComplete ? 'bg-green-500/20 text-green-300' :
                    isCurrent ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-700/30 text-slate-400'
                  }`}
                  animate={{ scale: isCurrent ? 1.05 : 1 }}
                >
                  <Icon className="w-3 h-3" />
                  <span>{getSectionName(section)}</span>
                  {isComplete && <CheckCircle2 className="w-3 h-3 ml-1" />}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3' 
                  : 'bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className={`text-xs mt-2 opacity-60`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800/80 text-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                <span className="text-sm">Analyzing your financial projections...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-black/20 backdrop-blur-sm border-t border-blue-500/20 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Describe your team structure, costs, revenue projections..."
            className="flex-1 bg-slate-800/80 text-white placeholder-slate-400 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}