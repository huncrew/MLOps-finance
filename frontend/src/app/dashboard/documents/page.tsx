"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { apiClient } from "@/lib/api";
import { DocumentUpload } from "@/components/document-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Eye,
  Download,
  Clock,
  BarChart3,
  Upload
} from "lucide-react";

export default function DocumentsPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.listAnalyses();
      if (response.success && response.data) {
        // The backend returns {success: true, data: {success: true, analyses: [...]}}
        const analysesArray = response.data.data?.analyses || response.data.analyses || [];
        const formattedAnalyses = analysesArray.map((item: any) => ({
          id: item.analysis_id || item.id,
          documentName: item.document_name || item.filename || 'Unknown Document',
          uploadDate: item.created_date || item.uploadDate || new Date().toISOString(),
          status: item.status || 'completed',
          complianceScore: Math.round((parseFloat(item.summary?.overallScore || item.overall_score || 0)) * 100),
          riskLevel: parseFloat(item.summary?.overallScore || item.overall_score || 0) >= 0.8 ? 'low' : parseFloat(item.summary?.overallScore || item.overall_score || 0) >= 0.6 ? 'medium' : 'high',
          frameworks: item.frameworks || ['Basel III', 'GDPR'],
          findings: {
            gaps: item.compliance_gaps?.length || 0,
            risks: item.risk_flags?.length || 0,
            recommendations: item.recommendations?.length || 0
          }
        }));
        setAnalyses(formattedAnalyses);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (documentId: string, analysisId: string) => {
    console.log("Upload complete:", { documentId, analysisId });
    // Refresh the analyses list after upload
    setTimeout(() => {
      loadAnalyses();
    }, 2000); // Give it time to process
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
    // Show error toast or notification
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return <Badge className="bg-green-100 text-green-700">Low Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-700">Medium Risk</Badge>;
      case "high":
        return <Badge className="bg-red-100 text-red-700">High Risk</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Analysis</h1>
            <p className="text-gray-600">
              Upload financial documents for AI-powered compliance analysis and risk assessment
            </p>
          </div>

          {/* Debug Section */}
          <div className="mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Debug API - Document Analysis vs Knowledge Base</CardTitle>
                <CardDescription>
                  <strong>Note:</strong> This page shows <em>Document Analysis Results</em> (compliance analysis). 
                  If you uploaded documents to the <em>Knowledge Base</em> (for RAG queries), 
                  they will appear on the Knowledge Base page instead.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await apiClient.healthCheck();
                        console.log('Health Check:', response);
                        alert('Health Check: ' + JSON.stringify(response, null, 2));
                      } catch (error) {
                        console.error('Health Check Error:', error);
                        alert('Health Check Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      }
                    }}
                  >
                    Test Health Check
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await apiClient.listAnalyses();
                        console.log('List Analyses:', response);
                        alert('Analysis Results: ' + JSON.stringify(response, null, 2));
                      } catch (error) {
                        console.error('List Analyses Error:', error);
                        alert('Analysis Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      }
                    }}
                  >
                    Test Analysis Results
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await apiClient.getKBDocuments();
                        console.log('KB Documents:', response);
                        alert('KB Documents: ' + JSON.stringify(response, null, 2));
                      } catch (error) {
                        console.error('KB Documents Error:', error);
                        alert('KB Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      }
                    }}
                  >
                    Test KB Documents
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/dashboard/knowledge', '_blank')}
                  >
                    Open Knowledge Base Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          <div className="mb-8">
            <DocumentUpload
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
              maxFileSize={50}
              acceptedTypes={['.pdf', '.docx', '.doc', '.txt']}
            />
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Last updated: {new Date().toLocaleString()}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadAnalyses}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analyses...</p>
              </div>
            ) : analyses.length > 0 ? (
              <div className="grid gap-6">
                {analyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{analysis.documentName}</CardTitle>
                          <CardDescription>
                            Uploaded {new Date(analysis.uploadDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(analysis.status)}
                        {analysis.status === "completed" && getRiskBadge(analysis.riskLevel)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {analysis.status === "completed" ? (
                      <div className="space-y-4">
                        {/* Compliance Score */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Compliance Score</span>
                          </div>
                          <div className={`text-2xl font-bold ${getComplianceColor(analysis.complianceScore)}`}>
                            {analysis.complianceScore}%
                          </div>
                        </div>

                        {/* Frameworks */}
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Analyzed Frameworks:</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.frameworks.map((framework: string) => (
                              <Badge key={framework} variant="outline">
                                {framework}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Findings Summary */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center justify-center mb-1">
                              <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
                              <span className="text-sm font-medium text-red-700">Gaps</span>
                            </div>
                            <div className="text-xl font-bold text-red-600">{analysis.findings.gaps}</div>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center justify-center mb-1">
                              <Shield className="h-4 w-4 text-yellow-600 mr-1" />
                              <span className="text-sm font-medium text-yellow-700">Risks</span>
                            </div>
                            <div className="text-xl font-bold text-yellow-600">{analysis.findings.risks}</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center mb-1">
                              <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                              <span className="text-sm font-medium text-blue-700">Recommendations</span>
                            </div>
                            <div className="text-xl font-bold text-blue-600">{analysis.findings.recommendations}</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-3 pt-4 border-t">
                          <Button size="sm" className="flex items-center">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="flex items-center">
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                          </Button>
                          <Button size="sm" variant="outline" className="flex items-center">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </Button>
                        </div>
                      </div>
                    ) : analysis.status === "processing" ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Analyzing document for compliance...</p>
                          <p className="text-sm text-gray-500 mt-1">This may take a few minutes</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p className="text-gray-600">Analysis failed</p>
                          <Button size="sm" variant="outline" className="mt-2">
                            Retry Analysis
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
                <p className="text-gray-600 mb-6">Upload your first financial document to get started with AI-powered compliance analysis.</p>
                <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}