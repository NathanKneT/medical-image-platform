'use client';

import { useState } from 'react';
import { 
  Brain, 
  Heart, 
  Eye, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  Share2,
  ChevronDown,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ResultsDisplayProps {
  results?: any;
  confidenceScore?: number;
  analysisId: string;
  className?: string;
}

interface Finding {
  id: string;
  category: 'normal' | 'abnormal' | 'suspicious' | 'artifact';
  title: string;
  description: string;
  confidence: number;
  severity?: 'low' | 'medium' | 'high';
  location?: string;
  measurements?: {
    area?: number;
    volume?: number;
    density?: number;
  };
}

interface AnalysisSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  findings: Finding[];
  summary: string;
  isExpanded: boolean;
}

// Mock data generator for demo purposes
const generateMockResults = (): AnalysisSection[] => [
  {
    id: 'anatomical',
    title: 'Anatomical Structure Analysis',
    icon: Brain,
    isExpanded: true,
    summary: '3 structures analyzed, 1 minor finding detected',
    findings: [
      {
        id: 'brain-1',
        category: 'normal',
        title: 'Cerebral Cortex',
        description: 'Normal cortical thickness and signal intensity throughout both hemispheres.',
        confidence: 0.94,
        location: 'Bilateral cerebral hemispheres',
        measurements: { volume: 1250, density: 45 }
      },
      {
        id: 'brain-2',
        category: 'suspicious',
        title: 'White Matter Hyperintensity',
        description: 'Small focal hyperintense lesion in the right frontal white matter, consistent with age-related changes.',
        confidence: 0.78,
        severity: 'low',
        location: 'Right frontal lobe',
        measurements: { area: 3.2, volume: 0.8 }
      },
      {
        id: 'brain-3',
        category: 'normal',
        title: 'Ventricular System',
        description: 'Normal ventricular size and configuration. No evidence of hydrocephalus.',
        confidence: 0.96,
        location: 'Lateral and third ventricles'
      }
    ]
  },
  {
    id: 'pathological',
    title: 'Pathological Assessment',
    icon: Heart,
    isExpanded: false,
    summary: 'No significant pathological findings',
    findings: [
      {
        id: 'path-1',
        category: 'normal',
        title: 'Tissue Integrity',
        description: 'No evidence of acute infarction, hemorrhage, or mass lesions.',
        confidence: 0.92,
      },
      {
        id: 'path-2',
        category: 'normal',
        title: 'Vascular Assessment',
        description: 'Normal appearing major intracranial vessels without stenosis or aneurysm.',
        confidence: 0.89,
      }
    ]
  },
  {
    id: 'quantitative',
    title: 'Quantitative Measurements',
    icon: BarChart3,
    isExpanded: false,
    summary: 'All measurements within normal limits',
    findings: [
      {
        id: 'quant-1',
        category: 'normal',
        title: 'Brain Volume',
        description: 'Total brain volume of 1,347 mL is within normal range for age and gender.',
        confidence: 0.97,
        measurements: { volume: 1347 }
      },
      {
        id: 'quant-2',
        category: 'normal',
        title: 'Cortical Thickness',
        description: 'Mean cortical thickness of 2.8mm, consistent with normal aging patterns.',
        confidence: 0.91,
        measurements: { density: 2.8 }
      }
    ]
  }
];

export function ResultsDisplay({ 
  results, 
  confidenceScore, 
  analysisId,
  className = '' 
}: ResultsDisplayProps) {
  const [sections, setSections] = useState<AnalysisSection[]>(generateMockResults());
  const [activeView, setActiveView] = useState<'detailed' | 'summary' | 'charts'>('detailed');

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    ));
  };

  const getCategoryIcon = (category: Finding['category']) => {
    switch (category) {
      case 'normal': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'abnormal': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'suspicious': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'artifact': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: Finding['category']) => {
    switch (category) {
      case 'normal': return 'border-green-200 bg-green-50';
      case 'abnormal': return 'border-red-200 bg-red-50';
      case 'suspicious': return 'border-yellow-200 bg-yellow-50';
      case 'artifact': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityColor = (severity?: Finding['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const overallStats = {
    total: sections.reduce((sum, section) => sum + section.findings.length, 0),
    normal: sections.reduce((sum, section) => 
      sum + section.findings.filter(f => f.category === 'normal').length, 0
    ),
    abnormal: sections.reduce((sum, section) => 
      sum + section.findings.filter(f => f.category === 'abnormal').length, 0
    ),
    suspicious: sections.reduce((sum, section) => 
      sum + section.findings.filter(f => f.category === 'suspicious').length, 0
    ),
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary-600" />
              Analysis Results
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{overallStats.total}</div>
              <div className="text-sm text-blue-800">Total Findings</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{overallStats.normal}</div>
              <div className="text-sm text-green-800">Normal</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{overallStats.suspicious}</div>
              <div className="text-sm text-yellow-800">Suspicious</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{overallStats.abnormal}</div>
              <div className="text-sm text-red-800">Abnormal</div>
            </div>
          </div>

          {confidenceScore && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Confidence</span>
                <span className="text-sm font-bold text-gray-900">
                  {Math.round(confidenceScore * 100)}%
                </span>
              </div>
              <Progress value={confidenceScore * 100} className="h-2" />
            </div>
          )}

          {/* View Toggle */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'detailed', label: 'Detailed View', icon: Eye },
              { id: 'summary', label: 'Summary', icon: BarChart3 },
              { id: 'charts', label: 'Charts', icon: PieChart },
            ].map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id as any)}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${activeView === view.id
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {view.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {activeView === 'detailed' && (
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id}>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-primary-600" />
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{section.summary}</p>
                      </div>
                    </div>
                    {section.isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                
                {section.isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {section.findings.map((finding) => (
                        <div
                          key={finding.id}
                          className={`border rounded-lg p-4 ${getCategoryColor(finding.category)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(finding.category)}
                              <h4 className="font-medium text-gray-900">{finding.title}</h4>
                              {finding.severity && (
                                <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(finding.severity)}`}>
                                  {finding.severity.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {Math.round(finding.confidence * 100)}%
                              </div>
                              <div className="text-xs text-gray-500">confidence</div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{finding.description}</p>
                          
                          {finding.location && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Location:</span> {finding.location}
                            </div>
                          )}
                          
                          {finding.measurements && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              {finding.measurements.area && (
                                <div>
                                  <span className="font-medium text-gray-600">Area:</span>
                                  <span className="ml-1">{finding.measurements.area} mm²</span>
                                </div>
                              )}
                              {finding.measurements.volume && (
                                <div>
                                  <span className="font-medium text-gray-600">Volume:</span>
                                  <span className="ml-1">{finding.measurements.volume} mL</span>
                                </div>
                              )}
                              {finding.measurements.density && (
                                <div>
                                  <span className="font-medium text-gray-600">Density:</span>
                                  <span className="ml-1">{finding.measurements.density} HU</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {activeView === 'summary' && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Findings</h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Normal cerebral cortex and ventricular system with no signs of acute pathology</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Eye className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>Minor white matter hyperintensity consistent with age-related changes</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>All quantitative measurements within normal limits for patient demographics</span>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Clinical Recommendations</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="space-y-1 text-sm">
                    <li>• Continue routine follow-up as clinically indicated</li>
                    <li>• No immediate intervention required for detected findings</li>
                    <li>• Consider follow-up imaging in 12 months if clinically warranted</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Notes</h3>
                <p className="text-sm text-gray-600">
                  Analysis completed using AI model trained on over 10,000 similar cases. 
                  Results should be interpreted in clinical context by a qualified radiologist.
                  Overall analysis confidence: {confidenceScore ? Math.round(confidenceScore * 100) : 'N/A'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'charts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Findings Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Normal', count: overallStats.normal, color: 'bg-green-500' },
                  { label: 'Suspicious', count: overallStats.suspicious, color: 'bg-yellow-500' },
                  { label: 'Abnormal', count: overallStats.abnormal, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${item.color}`}></div>
                    <span className="flex-1 text-sm">{item.label}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                    <div className="w-24">
                      <Progress 
                        value={(item.count / overallStats.total) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confidence Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sections.flatMap(section => section.findings).map((finding) => (
                  <div key={finding.id} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-3">{finding.title}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20">
                        <Progress value={finding.confidence * 100} className="h-2" />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">
                        {Math.round(finding.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}