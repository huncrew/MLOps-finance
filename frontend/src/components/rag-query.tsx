"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  MessageSquare, 
  FileText, 
  Clock, 
  TrendingUp,
  Shield,
  BookOpen,
  AlertCircle,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";

interface QuerySource {
  documentId: string;
  documentName: string;
  category: string;
  chunkId: string;
  relevanceScore: number;
  excerpt: string;
}

interface QueryResponse {
  queryId: string;
  responseText: string;
  sources: QuerySource[];
  confidenceScore: number;
  processingTimeMs: number;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
}

interface QueryHistory {
  queryId: string;
  queryText: string;
  responseText: string;
  createdDate: string;
  confidenceScore: number;
}

interface RAGQueryProps {
  onQuerySubmit?: (query: string, queryType: string) => Promise<QueryResponse>;
  queryHistory?: QueryHistory[];
  isLoading?: boolean;
}

export function RAGQuery({ onQuerySubmit, queryHistory = [], isLoading = false }: RAGQueryProps) {
  const [query, setQuery] = useState("");
  const [queryType, setQueryType] = useState("general");
  const [currentResponse, setCurrentResponse] = useState<QueryResponse | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    try {
      const response = await onQuerySubmit?.(query.trim(), queryType);
      if (response) {
        setCurrentResponse(response);
      }
    } catch (error) {
      console.error('Query error:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const getQueryTypeIcon = (type: string) => {
    switch (type) {
      case 'policy': return <Shield className="h-4 w-4" />;
      case 'regulation': return <BookOpen className="h-4 w-4" />;
      case 'compliance': return <AlertCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getQueryTypeColor = (type: string) => {
    switch (type) {
      case 'policy': return 'bg-blue-100 text-blue-700';
      case 'regulation': return 'bg-purple-100 text-purple-700';
      case 'compliance': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Knowledge Base Query
          </CardTitle>
          <CardDescription>
            Ask questions about policies, regulations, and compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Query Type</label>
              <Select value={queryType} onValueChange={setQueryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Question</SelectItem>
                  <SelectItem value="policy">Policy Inquiry</SelectItem>
                  <SelectItem value="regulation">Regulatory Question</SelectItem>
                  <SelectItem value="compliance">Compliance Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Question</label>
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What are the requirements for quarterly financial reporting?"
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              disabled={!query.trim() || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Query
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Response */}
      {currentResponse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Query Response</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={`${getQueryTypeColor(queryType)}`}>
                  {getQueryTypeIcon(queryType)}
                  <span className="ml-1 capitalize">{queryType}</span>
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(currentResponse.responseText)}
                >
                  {copiedText === currentResponse.responseText ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Response Text */}
            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {currentResponse.responseText}
                </p>
              </div>
            </div>

            {/* Response Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className={`text-lg font-bold ${getConfidenceColor(currentResponse.confidenceScore)}`}>
                  {Math.round(currentResponse.confidenceScore * 100)}%
                </div>
                <div className="text-xs text-gray-500">Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {(currentResponse.processingTimeMs / 1000).toFixed(1)}s
                </div>
                <div className="text-xs text-gray-500">Processing Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {currentResponse.tokenUsage.inputTokens + currentResponse.tokenUsage.outputTokens}
                </div>
                <div className="text-xs text-gray-500">Tokens Used</div>
              </div>
            </div>

            {/* Sources */}
            {currentResponse.sources.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Sources ({currentResponse.sources.length})
                </h4>
                <div className="space-y-2">
                  {currentResponse.sources.map((source, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {source.category}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {source.documentName}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(source.relevanceScore * 100)}% relevant
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Document ID: {source.documentId}
                      </p>
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-700 italic">
                          "{source.excerpt}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Query History */}
      {queryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Queries</CardTitle>
            <CardDescription>
              Your previous Knowledge Base queries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queryHistory.slice(0, 5).map((historyItem) => (
                <div key={historyItem.queryId} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {historyItem.queryText}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(historyItem.confidenceScore * 100)}%
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(historyItem.createdDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {historyItem.responseText}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}