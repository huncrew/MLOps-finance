"use client";

import { useState } from "react";
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

// Mock knowledge base documents
const mockKBDocs = [
  {
    id: "kb-001",
    filename: "Basel_III_Guidelines.pdf",
    category: "Banking Regulation",
    status: "processed",
    uploadDate: "2024-10-25T14:30:00Z",
    chunkCount: 156,
    size: "2.4 MB"
  },
  {
    id: "kb-002",
    filename: "GDPR_Compliance_Manual.pdf",
    category: "Data Protection",
    status: "processed",
    uploadDate: "2024-10-24T16:20:00Z",
    chunkCount: 89,
    size: "1.8 MB"
  },
  {
    id: "kb-003",
    filename: "SOX_Requirements_2024.docx",
    category: "Financial Reporting",
    status: "processing",
    uploadDate: "2024-10-27T12:00:00Z",
    chunkCount: 0,
    size: "1.2 MB"
  }
];

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = ["all", "Banking Regulation", "Data Protection", "Financial Reporting"];

  const filteredDocs = mockKBDocs.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchQuery.toLowerCase());
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
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
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
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc.status === 'processed' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <Database className={`h-5 w-5 ${
                          doc.status === 'processed' ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{doc.filename}</CardTitle>
                        <CardDescription>
                          {doc.category} • {doc.size} • {new Date(doc.uploadDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={doc.status === 'processed' ? "default" : "secondary"}>
                      {doc.status === 'processed' ? "Ready" : "Processing"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {doc.status === 'processed' && (
                        <>
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {doc.chunkCount} chunks
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Available for queries
                          </span>
                        </>
                      )}
                      {doc.status === 'processing' && (
                        <span className="flex items-center">
                          <Brain className="h-4 w-4 mr-1 animate-pulse" />
                          Processing for RAG...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? "Try adjusting your search terms" : "Upload regulatory documents to get started"}
                </p>
                <Button>
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