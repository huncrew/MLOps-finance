"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database,
  Search,
  Plus,
  FileText,
  MessageSquare,
  Brain,
  Upload,
  Eye,
  Trash2
} from "lucide-react";
import { apiClient } from "@/lib/api";

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [kbDocs, setKbDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(["all"]);

  // Load KB documents on mount
  useEffect(() => {
    loadKBDocuments();
  }, []);

  const loadKBDocuments = async () => {
    try {
      const response = await apiClient.getKBDocuments();
      if (response.success && response.data) {
        const payload = response.data as any;
        const documents = payload.documents ?? payload.data?.documents ?? [];

        const normalized = documents.map((doc: any) => {
          const status = doc.embeddingStatus || doc.status || 'pending';
          const sizeValue = doc.size;
          let displaySize = '—';
          if (typeof sizeValue === 'string') {
            displaySize = sizeValue;
          } else if (typeof sizeValue === 'number') {
            displaySize = sizeValue < 1024 ? `${sizeValue} B` : `${Math.round(sizeValue / 1024)} KB`;
          }

          return {
            id: doc.id || doc.documentId,
            filename: doc.filename,
            category: doc.category || 'Uncategorized',
            status,
            uploadDate: doc.uploadDate,
            chunkCount: Number(doc.chunkCount ?? 0),
            size: displaySize,
          };
        });

        setKbDocs(normalized);
        const uniqueCategories = Array.from(new Set(normalized.map((doc: any) => doc.category).filter(Boolean)));
        setCategories(["all", ...uniqueCategories]);
      }
    } catch (error) {
      console.error('Failed to load KB documents:', error);
    }
  };

  const handleUploadDocument = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.doc,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const response = await apiClient.uploadKBDocument(file, selectedCategory !== "all" ? selectedCategory : undefined);
        if (response.success) {
          // Refresh the document list
          await loadKBDocuments();
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await apiClient.deleteKBDocument(documentId);
      if (response.success) {
        await loadKBDocuments();
      } else {
        throw new Error(response.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const filteredDocs = kbDocs.filter(doc => {
    const matchesSearch = (doc.filename || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
              <p className="text-gray-600">
                Manage regulatory documents and compliance frameworks for RAG queries
              </p>
            </div>
            <Button 
              className="flex items-center" 
              onClick={handleUploadDocument}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Document
            </Button>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === "all" ? "All Categories" : category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid */}
          <div className="grid gap-6">
            {filteredDocs.map((doc) => {
              const status = (doc.status || 'pending').toLowerCase();
              const isProcessed = status === 'processed' || status === 'completed';
              const statusLabel = (doc.status || 'pending').replace(/_/g, ' ');

              return (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isProcessed ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          <Database className={`h-5 w-5 ${
                            isProcessed ? 'text-green-600' : 'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{doc.filename}</CardTitle>
                          <CardDescription>
                            {doc.category} • {doc.size} • {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString() : '—'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={isProcessed ? "default" : "secondary"}>
                        {statusLabel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {doc.chunkCount ?? 0} chunks
                        </span>
                        {isProcessed ? (
                          <span className="flex items-center text-green-600">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Available for queries
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-600">
                            <Brain className="h-4 w-4 mr-1 animate-pulse" />
                            Processing embeddings...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredDocs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Upload regulatory documents to get started"}
                </p>
                <Button onClick={handleUploadDocument}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
