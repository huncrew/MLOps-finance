"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Brain, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

interface RAGQueryProps {
  onQueryComplete?: (queryId: string, response: string) => void;
  onError?: (error: string) => void;
}

interface QueryResult {
  id: string;
  query: string;
  response: string;
  confidence: number;
  sources: string[];
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
}

export function RAGQuery({ onQueryComplete, onError }: RAGQueryProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([]);

  // Load query history on component mount
  useEffect(() => {
    loadQueryHistory();
  }, []);

  const loadQueryHistory = async () => {
    try {
      const response = await apiClient.getQueryHistory();
      if (response.success && response.data) {
        const payload = response.data as any;
        const queries = payload.queries ?? payload.data?.queries ?? [];
        setQueryHistory(
          queries.map((item: any) => ({
            id: item.queryId || Math.random().toString(36).substr(2, 9),
            query: item.queryText || item.query || '',
            response: item.responseText || item.response || '',
            confidence: Number(item.confidenceScore ?? 0),
            sources: (item.sources || []).map((source: any) => source.documentName || source.documentId || ''),
            timestamp: item.createdDate || new Date().toISOString(),
            status: 'completed' as const
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load query history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const queryId = Math.random().toString(36).substr(2, 9);
    const newQuery: QueryResult = {
      id: queryId,
      query: query.trim(),
      response: "",
      confidence: 0,
      sources: [],
      timestamp: new Date().toISOString(),
      status: 'processing'
    };

    setQueryHistory(prev => [newQuery, ...prev]);
    setIsLoading(true);
    const currentQuery = query.trim();
    setQuery("");

    try {
      const response = await apiClient.queryKnowledgeBase(currentQuery);
      
      if (response.success && response.data) {
        const payload = response.data as any;
        const responseData = payload.response || payload;
        const responseText = responseData.responseText || responseData.response || 'No response received';
        const confidenceScore = Number(responseData.confidenceScore ?? payload.confidenceScore ?? 0);
        const sources = (responseData.sources || payload.sources || []).map((source: any) => source.documentName || source.documentId || '');

        setQueryHistory(prev => prev.map(q => 
          q.id === queryId 
            ? { 
                ...q, 
                response: responseText,
                confidence: confidenceScore,
                sources,
                status: 'completed' 
              }
            : q
        ));

        onQueryComplete?.(queryId, responseText);
        await loadQueryHistory();
      } else {
        throw new Error(response.error || 'Query failed');
      }
    } catch (error) {
      console.error('Query error:', error);
      setQueryHistory(prev => prev.map(q => 
        q.id === queryId ? { ...q, status: 'error' } : q
      ));
      onError?.(error instanceof Error ? error.message : 'Query failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: QueryResult['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          RAG Knowledge Base Query
        </CardTitle>
        <CardDescription>
          Ask questions about your regulatory documents and compliance frameworks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Query Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about compliance requirements, regulations, or policies..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!query.trim() || isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Example: "What are the Basel III capital requirements?" or "How should we handle GDPR data retention?"
          </div>
        </form>

        {/* Query History */}
        {queryHistory.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Query History ({queryHistory.length})
            </h4>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {queryHistory.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(result.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {result.query}
                        </span>
                      </div>
                      {result.status === 'completed' && (
                        <>
                          <div className="text-sm text-gray-700 mb-3 leading-relaxed">
                            {result.response}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {Math.round(result.confidence * 100)}% confidence
                            </Badge>
                            {result.sources.length > 0 && (
                              <span>Sources: {result.sources.join(", ")}</span>
                            )}
                          </div>
                        </>
                      )}
                      {result.status === 'processing' && (
                        <div className="text-sm text-gray-500">
                          Searching knowledge base...
                        </div>
                      )}
                      {result.status === 'error' && (
                        <div className="text-sm text-red-600">
                          Query failed. Please try again.
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {queryHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No queries yet. Ask your first question about compliance or regulations!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
