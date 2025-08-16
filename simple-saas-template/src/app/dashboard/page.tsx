"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionGate } from "@/components/subscription-gate";
import { DashboardLayout } from "@/components/dashboard-layout";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Crown, 
  Zap, 
  Eye, 
  Target, 
  Globe, 
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Newspaper
} from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Media Intelligence Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Track company mentions and discover advertising opportunities across premium publications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
            <Newspaper className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">24,847</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publications Tracked</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">1,247</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-blue-500 mr-1" />
              +8 new this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Page Views</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">847K</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-purple-500 mr-1" />
              +23.1% engagement
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Opportunities</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">342</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 text-orange-500 mr-1" />
              High-value targets
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Top Companies by Mentions */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Companies by Mentions</CardTitle>
              <CardDescription>Companies with highest mention frequency this month</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { company: "Apple Inc.", mentions: 2847, change: "+12.3%", trend: "up", publications: 247, avgViews: "1.2M" },
                { company: "Microsoft Corp.", mentions: 2156, change: "+8.7%", trend: "up", publications: 189, avgViews: "890K" },
                { company: "Tesla Inc.", mentions: 1923, change: "-2.1%", trend: "down", publications: 156, avgViews: "1.5M" },
                { company: "Amazon.com", mentions: 1847, change: "+15.2%", trend: "up", publications: 203, avgViews: "967K" },
                { company: "Google LLC", mentions: 1634, change: "+6.8%", trend: "up", publications: 178, avgViews: "1.1M" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {item.company.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.company}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{item.publications} publications</span>
                        <span>•</span>
                        <span>{item.avgViews} avg views</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{item.mentions.toLocaleString()}</p>
                      <p className={`text-sm flex items-center ${item.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {item.change}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advertising Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-orange-600" />
              Ad Opportunities
            </CardTitle>
            <CardDescription>High-value advertising placements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { publication: "TechCrunch", mentions: 45, views: "2.3M", score: 95 },
                { publication: "Forbes", mentions: 38, views: "1.8M", score: 92 },
                { publication: "WSJ", mentions: 32, views: "1.5M", score: 89 },
                { publication: "Bloomberg", mentions: 28, views: "1.2M", score: 87 },
                { publication: "Reuters", mentions: 24, views: "980K", score: 84 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.publication}</p>
                    <p className="text-sm text-gray-500">{item.mentions} mentions • {item.views} views</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.score >= 90 ? "default" : item.score >= 85 ? "secondary" : "outline"} className="mb-1">
                      {item.score}
                    </Badge>
                    <p className="text-xs text-gray-500">Opp. Score</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All Opportunities
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Premium Features - Behind subscription gate */}
      <SubscriptionGate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-emerald-900">Advanced Analytics</CardTitle>
              </div>
              <CardDescription className="text-emerald-700">
                Deep insights into mention patterns and advertising ROI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-900">Mention Accuracy</span>
                  <span className="text-2xl font-bold text-emerald-600">94.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-900">Avg. Ad ROI</span>
                  <span className="text-2xl font-bold text-emerald-600">340%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-900">Cost per Mention</span>
                  <span className="text-2xl font-bold text-emerald-600">$0.23</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Trend Analysis</CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                Real-time sentiment and mention trend monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Positive sentiment spike detected</p>
                    <p className="text-xs text-blue-600">Apple Inc. • 15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">High-value ad opportunity</p>
                    <p className="text-xs text-blue-600">TechCrunch • 1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">New publication added</p>
                    <p className="text-xs text-blue-600">VentureBeat • 2 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SubscriptionGate>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Mentions</CardTitle>
            <CardDescription>
              Latest company mentions across tracked publications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { company: "Tesla", publication: "TechCrunch", time: "2 minutes ago", sentiment: "positive" },
                { company: "Apple", publication: "Forbes", time: "8 minutes ago", sentiment: "neutral" },
                { company: "Microsoft", publication: "WSJ", time: "15 minutes ago", sentiment: "positive" },
                { company: "Amazon", publication: "Bloomberg", time: "23 minutes ago", sentiment: "negative" },
                { company: "Google", publication: "Reuters", time: "31 minutes ago", sentiment: "positive" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    item.sentiment === 'positive' ? 'bg-emerald-500' : 
                    item.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      <span className="text-emerald-600">{item.company}</span> mentioned in {item.publication}
                    </p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.sentiment}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and media intelligence tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search Companies
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Target className="mr-2 h-4 w-4" />
              Find Ad Opportunities
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Globe className="mr-2 h-4 w-4" />
              Add Publications
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}