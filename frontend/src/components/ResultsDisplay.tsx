'use client';

import { useState } from 'react';
import { 
  Brain, 
  Eye, 
  CheckCircle2,
  Info,
  BarChart3,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ResultsDisplayProps {
  results?: any; // The results object from the backend API, need to typesafe this one
  confidenceScore?: number;
  analysisId: string;
  className?: string;
}

// Helper to determine the primary finding type from the results
const getPrimaryFindingType = (results: any): 'classification' | 'segmentation' | 'detection' | 'unknown' => {
  if (results?.prediction) return 'classification';
  if (results?.segmentation) return 'segmentation';
  if (results?.detection) return 'detection';
  return 'unknown';
};

const renderClassificationResults = (results: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <Brain className="h-5 w-5 mr-2 text-primary-600" /> Pathological Assessment
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">Primary Prediction</h4>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {results.prediction.probability ? `${Math.round(results.prediction.probability * 100)}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">confidence</div>
          </div>
        </div>
        <p className="text-2xl font-bold text-center text-blue-800 my-4">
          {results.prediction.class || 'N/A'}
        </p>
        {results.prediction.class_probabilities && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Class Probabilities</h5>
            <div className="space-y-2">
              {Object.entries(results.prediction.class_probabilities).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center">
                  <span className="text-xs text-gray-600 w-28 truncate">{key}</span>
                  <Progress value={value * 100} className="flex-1 h-2" />
                  <span className="text-xs font-mono ml-2">{Math.round(value * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const renderSegmentationResults = (results: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <BarChart3 className="h-5 w-5 mr-2 text-primary-600" /> Quantitative Measurements
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="border rounded-lg p-4 bg-green-50 border-green-200">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <Info className="h-4 w-4 mr-2 text-green-600" />
          Tumor Segmentation Details
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Tumor Detected:</span>
            <span className="ml-1 font-bold">{results.segmentation.tumor_detected ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Volume (ml):</span>
            <span className="ml-1 font-bold">{results.segmentation.tumor_volume_ml}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Location:</span>
            <span className="ml-1 font-bold capitalize">{results.segmentation.tumor_location?.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Mask URL:</span>
            <a href={results.segmentation.mask_url} className="ml-1 font-bold text-blue-600 hover:underline">Download</a>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const renderDetectionResults = (results: any) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center text-lg">
        <Eye className="h-5 w-5 mr-2 text-primary-600" /> Nodule Detection
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">
          Found {results.detection.nodules_found} Nodule(s)
        </h4>
        {results.detection.nodules.map((nodule: any) => (
          <div key={nodule.id} className="border-t border-yellow-200 py-3">
            <div className="flex items-start justify-between">
              <h5 className="font-semibold text-yellow-900">{nodule.id}</h5>
              <span className={`px-2 py-1 text-xs rounded-full bg-yellow-200 text-yellow-800`}>
                {nodule.malignancy_risk.toUpperCase()} RISK
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Confidence:</span>
                <span className="ml-1">{Math.round(nodule.confidence * 100)}%</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Diameter:</span>
                <span className="ml-1">{nodule.diameter_mm} mm</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Characteristics:</span>
                <span className="ml-1">
                  {nodule.characteristics.solid && 'Solid, '}
                  {nodule.characteristics.calcified && 'Calcified, '}
                  {nodule.characteristics.spiculated && 'Spiculated'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);


export function ResultsDisplay({ 
  results, 
  confidenceScore, 
  analysisId,
  className = '' 
}: ResultsDisplayProps) {

  const [activeView, setActiveView] = useState<'detailed' | 'summary' | 'charts'>('detailed');

  if (!results) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Info className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results available</h3>
            <p className="mt-1 text-sm text-gray-500">The analysis may still be in progress or did not produce any output.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const findingType = getPrimaryFindingType(results);
  
  const overallStats = {
    total: results.detection?.nodules_found || (results.prediction ? 1 : 0),
    normal: results.prediction?.class === 'Normal' ? 1 : 0,
    abnormal: results.detection?.nodules_found || (results.prediction?.class !== 'Normal' ? 1 : 0),
    suspicious: results.detection?.nodules?.filter((n:any) => n.malignancy_risk === 'medium').length || 0,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Overall Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-primary-600" />
              Analysis Results for {results.model_name} (v{results.model_version})
            </CardTitle>
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
        </CardContent>
      </Card>

      {/* Main Content: Render based on the type of results received */}
      <div className="space-y-4">
        {findingType === 'classification' && renderClassificationResults(results)}
        {findingType === 'segmentation' && renderSegmentationResults(results)}
        {findingType === 'detection' && renderDetectionResults(results)}
        {findingType === 'unknown' && (
           <Card>
             <CardContent className="p-6 text-center">
               <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
               <p className="text-gray-600">The results from this model have an unrecognized format.</p>
             </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
}