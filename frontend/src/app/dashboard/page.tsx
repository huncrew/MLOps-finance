"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  MessageSquare, 
  Database,
  TrendingUp,
  Shield,
  Brain,
  Upload,
  Search,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Eye,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Plus,
  RefreshCw
} from "lucide-react";

// Mock data for the dashboard
const mockStats = {
  totalDocuments: 47,
  documentsAnalyzed: 42,
  averageComplianceScore: 0.87,
  totalQueries: 156,
  kbDocuments: 23,
  processingQueue: 2
};

const mockRecentAnalyses = [
  {
    analysisId: "analysis-001",
    documentName: "Q3_Financial_Report.pdf",
    status: "completed" as const,
    overallScore: 0.92,
    createdDate: "2024-10-27T10:30:00Z",
    complianceGaps: 2,
    riskFlags: 1
  },
  {
    analysisId: "analysis-002", 
    documentName: "Risk_Assessment_2024.docx",
    status: "completed" as const,
    overallScore: 0.78,
    createdDate: "2024-10-27T09:15:00Z",
    complianceGaps: 5,
    riskFlags: 3
  },
  {
    analysisId: "analysis-003",
    documentName: "Compliance_Manual_v2.pdf",
    status: "processing" as const,
    overallScore: 0,
    createdDate: "2024-10-27T11:45:00Z",
    complianceGaps: 0,
    riskFlags: 0
  }
];

const mockRecentQueries = [
  {
    queryId: "query-001",
    queryText: "What are the latest requirements for Basel III compliance?",
    confidenceScore: 0.94,
    createdDate: "2024-10-27T11:20:00Z",
    responsePreview: "Basel III requires banks to maintain a minimum Common Equity Tier 1 (CET1) capital ratio of 4.5% of risk-weighted assets..."
  },
  {
    queryId: "query-002",
    queryText: "How should we handle GDPR data retention policies?",
    confidenceScore: 0.89,
    createdDate: "2024-10-27T10:45:00Z", 
    responsePreview: "Under GDPR Article 5(1)(e), personal data should be kept in a form which permits identification of data subjects for no longer than..."
  }
];

const mockKBDocuments = [
  {
    documentId: "kb-001",
    filename: "Basel_III_Guidelines.pdf",
    category: "Banking Regulation",
    status: "processed" as const,
    uploadDate: "2024-10-25T14:30:00Z",
    chunkCount: 156
  },
  {
    documentId: "kb-002",
    filename: "GDPR_Compliance_Manual.pdf", 
    category: "Data Protection",
    status: "processed" as const,
    uploadDate: "2024-10-24T16:20:00Z",
    chunkCount: 89
  },
  {
    documentId: "kb-003",
    filename: "SOX_Requirements_2024.docx",
    category: "Financial Reporting",
    status: "processing" as const,
    uploadDate: "2024-10-27T12:00:00Z",
    chunkCount: 0
  }
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleViewAnalysis = (analysisId: string) => {
    console.log("View analysis:", analysisId);
    // TODO: Navigate to analysis detail page
  };

  const handleViewQuery = (queryId: string) => {
    console.log("View query:", queryId);
    // TODO: Navigate to query detail page
  };

  const handleUploadDocument = () => {
    console.log("Upload document");
    // TODO: Open document upload modal
  };

  const handleNewQuery = () => {
    console.log("New query");
    // TODO: Navigate to query interface
  };

  const handleUploadKBDocument = () => {
    console.log("Upload KB document");
    // TODO: Open KB document upload modal
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">MLOps Finance Dashboard</h1>
                <p className="text-blue-100">
                  AI-powered compliance analysis and regulatory intelligence
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Analyzed</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{mockStats.documentsAnalyzed}</div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.totalDocuments} total uploaded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(mockStats.averageComplianceScore * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Above industry average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Knowledge Base Queries</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{mockStats.totalQueries}</div>
                <p className="text-xs text-muted-foreground">
                  {mockStats.kbDocuments} KB documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing Queue</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{mockStats.processingQueue}</div>
                <p className="text-xs text-muted-foreground">
                  Documents pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: "overview", label: "Overview" },
                { id: "documents", label: "Document Analysis" },
                { id: "knowledge", label: "Knowledge Base" },
                { id: "queries", label: "RAG Queries" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Analyses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      Recent Analyses
                    </CardTitle>
                    <CardDescription>
                      Latest document compliance analyses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockRecentAnalyses.map((analysis) => (
                        <div key={analysis.analysisId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              analysis.status === 'completed' ? 'bg-green-500' : 
                              analysis.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-sm">{analysis.documentName}</p>
                              <p className="text-xs text-gray-500">
                                {analysis.status === 'completed' && (
                                  <>Score: {Math.round(analysis.overallScore * 100)}% • {analysis.complianceGaps} gaps</>
                                )}
                                {analysis.status === 'processing' && "Processing..."}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleViewAnalysis(analysis.analysisId)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Queries */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
                      Recent Queries
                    </CardTitle>
                    <CardDescription>
                      Latest knowledge base queries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockRecentQueries.map((query) => (
                        <div key={query.queryId} className="p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm line-clamp-2">{query.queryText}</p>
                            <Badge variant="outline" className="ml-2">
                              {Math.round(query.confidenceScore * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {query.responsePreview}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => handleViewQuery(query.queryId)}>
                            View Full Response
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "documents" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
                        Document Analysis
                      </CardTitle>
                      <CardDescription>
                        Upload and analyze financial documents for compliance
                      </CardDescription>
                    </div>
                    <Button onClick={handleUploadDocument}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentAnalyses.map((analysis) => (
                      <div key={analysis.analysisId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            analysis.status === 'completed' ? 'bg-green-100 text-green-600' : 
                            analysis.status === 'processing' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{analysis.documentName}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>
                                {analysis.status === 'completed' && `Compliance: ${Math.round(analysis.overallScore * 100)}%`}
                                {analysis.status === 'processing' && "Processing..."}
                              </span>
                              {analysis.status === 'completed' && (
                                <>
                                  <span>•</span>
                                  <span>{analysis.complianceGaps} gaps found</span>
                                  <span>•</span>
                                  <span>{analysis.riskFlags} risk flags</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {analysis.status === 'completed' && (
                            <Badge variant={analysis.overallScore >= 0.9 ? "default" : analysis.overallScore >= 0.7 ? "secondary" : "destructive"}>
                              {analysis.overallScore >= 0.9 ? "Excellent" : analysis.overallScore >= 0.7 ? "Good" : "Needs Review"}
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleViewAnalysis(analysis.analysisId)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "knowledge" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Database className="h-5 w-5 mr-2 text-green-600" />
                        Knowledge Base
                      </CardTitle>
                      <CardDescription>
                        Regulatory documents and compliance frameworks
                      </CardDescription>
                    </div>
                    <Button onClick={handleUploadKBDocument}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockKBDocuments.map((doc) => (
                      <div key={doc.documentId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            doc.status === 'processed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            <Database className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.filename}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{doc.category}</span>
                              {doc.status === 'processed' && (
                                <>
                                  <span>•</span>
                                  <span>{doc.chunkCount} chunks</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={doc.status === 'processed' ? "default" : "secondary"}>
                            {doc.status === 'processed' ? "Ready" : "Processing"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "queries" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-600" />
                        RAG Queries
                      </CardTitle>
                      <CardDescription>
                        Ask questions about your regulatory knowledge base
                      </CardDescription>
                    </div>
                    <Button onClick={handleNewQuery}>
                      <Search className="h-4 w-4 mr-2" />
                      New Query
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentQueries.map((query) => (
                      <div key={query.queryId} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-medium">{query.queryText}</p>
                          <Badge variant="outline">
                            {Math.round(query.confidenceScore * 100)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {query.responsePreview}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {new Date(query.createdDate).toLocaleString()}
                          </p>
                          <Button variant="outline" size="sm" onClick={() => handleViewQuery(query.queryId)}>
                            View Full Response
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}