"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  TrendingUp,
  Clock,
  Download,
  ExternalLink,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface PolicyMatch {
  policyId: string;
  policyName: string;
  matchScore: number;
  relevantSections: string[];
  documentReference: string;
}

interface ComplianceGap {
  gapType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

interface RiskFlag {
  riskType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
}

interface AnalysisResults {
  analysisId: string;
  documentName: string;
  analysisDate: string;
  overallScore: number;
  confidenceScore: number;
  processingTimeMs: number;
  policyMatches: PolicyMatch[];
  complianceGaps: ComplianceGap[];
  riskFlags: RiskFlag[];
  recommendations: string[];
}

interface AnalysisResultsProps {
  results: AnalysisResults;
  onDownloadReport?: () => void;
  onViewDetails?: (analysisId: string) => void;
}

export function AnalysisResults({ results, onDownloadReport, onViewDetails }: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return <Info className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Compliance Analysis Results
              </CardTitle>
              <CardDescription>
                {results.documentName} • Analyzed on {new Date(results.analysisDate).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
              <Button variant="outline" size="sm" onClick={() => onViewDetails?.(results.analysisId)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Overall Score */}
            <div className={`p-4 rounded-lg ${getScoreBackground(results.overallScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Score</span>
                <CheckCircle className={`h-4 w-4 ${getScoreColor(results.overallScore)}`} />
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(results.overallScore)}`}>
                {Math.round(results.overallScore * 100)}%
              </div>
              <Progress value={results.overallScore * 100} className="mt-2 h-2" />
            </div>

            {/* Confidence Score */}
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Confidence</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(results.confidenceScore * 100)}%
              </div>
              <Progress value={results.confidenceScore * 100} className="mt-2 h-2" />
            </div>

            {/* Policy Matches */}
            <div className="p-4 rounded-lg bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Policy Matches</span>
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {results.policyMatches.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Policies identified</p>
            </div>

            {/* Processing Time */}
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Processing Time</span>
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {(results.processingTimeMs / 1000).toFixed(1)}s
              </div>
              <p className="text-xs text-gray-500 mt-1">Analysis duration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="policies">Policy Matches</TabsTrigger>
          <TabsTrigger value="gaps">Compliance Gaps</TabsTrigger>
          <TabsTrigger value="risks">Risk Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.policyMatches.length}</div>
                  <div className="text-sm text-gray-600">Policy Matches Found</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.complianceGaps.length}</div>
                  <div className="text-sm text-gray-600">Compliance Gaps</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.riskFlags.length}</div>
                  <div className="text-sm text-gray-600">Risk Flags</div>
                </div>
              </div>

              {/* Recommendations */}
              {results.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Recommendations</h4>
                  <div className="space-y-2">
                    {results.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Policy Matches ({results.policyMatches.length})</CardTitle>
              <CardDescription>
                Policies and regulations identified in the document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.policyMatches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No policy matches found</p>
              ) : (
                <div className="space-y-4">
                  {results.policyMatches.map((match, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{match.policyName}</h4>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {Math.round(match.matchScore * 100)}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Policy ID: {match.policyId}</p>
                      <p className="text-sm text-gray-600 mb-3">Reference: {match.documentReference}</p>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Relevant Sections:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.relevantSections.map((section, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Gaps ({results.complianceGaps.length})</CardTitle>
              <CardDescription>
                Areas where the document may not meet compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.complianceGaps.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">No compliance gaps detected</p>
                  <p className="text-gray-500 text-sm">Document appears to meet all compliance requirements</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.complianceGaps.map((gap, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getSeverityIcon(gap.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 capitalize">
                              {gap.gapType.replace('_', ' ')}
                            </h4>
                            <Badge className={getSeverityColor(gap.severity)}>
                              {gap.severity} severity
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{gap.description}</p>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 mb-1">Recommendation:</p>
                            <p className="text-sm text-blue-800">{gap.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Flags ({results.riskFlags.length})</CardTitle>
              <CardDescription>
                Potential risks identified in the document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.riskFlags.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">No risk flags detected</p>
                  <p className="text-gray-500 text-sm">Document appears to have minimal risk exposure</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.riskFlags.map((risk, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getSeverityIcon(risk.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 capitalize">
                              {risk.riskType.replace('_', ' ')} Risk
                            </h4>
                            <Badge className={getSeverityColor(risk.severity)}>
                              {risk.severity} severity
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{risk.description}</p>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-red-900 mb-1">Potential Impact:</p>
                            <p className="text-sm text-red-800">{risk.impact}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}