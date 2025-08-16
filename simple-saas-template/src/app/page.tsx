import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoImage } from "@/components/ui/logo-image";
import { Check, Zap, Shield, Brain, TrendingUp, ArrowRight, Star, Users, Globe, Sparkles, BarChart3, Activity, Target, Bot, Cpu, Database, Search } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-emerald-50/30"></div>

          <div className="relative text-center max-w-4xl mx-auto">
              {/* Animated Badge */}
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-sm font-medium mb-8 border border-emerald-200 shadow-lg shadow-emerald-500/10 animate-bounce-subtle">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Powered by Advanced AI • Trusted by 10,000+ businesses
                </div>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-gray-900">
                <span className="inline-block animate-fade-in-up">AI-powered insights for</span>
                <span className="block bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent animate-gradient-x">
                  financial intelligence
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
                Transform financial data into actionable insights with advanced AI.
                <span className="relative inline-block">
                  <span className="relative z-10">Analyze markets, predict trends, and make smarter investment decisions.</span>
                  <span className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-200 to-green-200 opacity-30 transform -skew-x-12"></span>
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up animation-delay-500">
                <Button size="lg" className="group px-8 py-4 text-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-105" asChild>
                  <Link href="/auth/signin">
                    <span className="flex items-center">
                      <Zap className="mr-2 w-5 h-5 group-hover:animate-pulse" />
                      Start free trial
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg text-gray-700 hover:bg-emerald-50 border-gray-300 hover:border-emerald-300 transition-all duration-300" asChild>
                  <Link href="#demo">
                    <span className="flex items-center">
                      <Activity className="mr-2 w-5 h-5" />
                      Watch demo
                    </span>
                  </Link>
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600 mb-16">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  10,000+ financial professionals
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  $2B+ in assets analyzed
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
                  4.9/5 customer rating
                </div>
              </div>

              {/* Enhanced Company Logos */}
              <div className="max-w-4xl mx-auto animate-fade-in-up animation-delay-700">
                <p className="text-center text-gray-500 text-sm mb-8 font-medium">
                  <span className="inline-flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-emerald-500" />
                    Trusted by leading financial institutions worldwide
                  </span>
                </p>
                <div className="flex flex-wrap justify-center items-center gap-12 opacity-70">
                  {/* Enhanced brand logos with premium styling */}
                  <div className="group flex items-center justify-center h-16 px-6 py-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-white/60 hover:scale-110 transition-all duration-500 border border-gray-200/50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10">
                    <LogoImage
                      company="goldman-sachs"
                      alt="Goldman Sachs"
                      fallbackText="Goldman Sachs"
                      className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 filter group-hover:brightness-110"
                    />
                  </div>

                  <div className="group flex items-center justify-center h-16 px-6 py-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-white/60 hover:scale-110 transition-all duration-500 border border-gray-200/50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10">
                    <LogoImage
                      company="jpmorgan"
                      alt="JPMorgan Chase"
                      fallbackText="JPMorgan"
                      className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 filter group-hover:brightness-110"
                    />
                  </div>

                  <div className="group flex items-center justify-center h-16 px-6 py-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-white/60 hover:scale-110 transition-all duration-500 border border-gray-200/50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10">
                    <LogoImage
                      company="morgan-stanley"
                      alt="Morgan Stanley"
                      fallbackText="Morgan Stanley"
                      className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 filter group-hover:brightness-110"
                    />
                  </div>

                  <div className="group flex items-center justify-center h-16 px-6 py-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-white/60 hover:scale-110 transition-all duration-500 border border-gray-200/50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10">
                    <LogoImage
                      company="blackrock"
                      alt="BlackRock"
                      fallbackText="BlackRock"
                      className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 filter group-hover:brightness-110"
                    />
                  </div>

                  <div className="group flex items-center justify-center h-16 px-6 py-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-white/60 hover:scale-110 transition-all duration-500 border border-gray-200/50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10">
                    <LogoImage
                      company="vanguard"
                      alt="Vanguard"
                      fallbackText="Vanguard"
                      className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 filter group-hover:brightness-110"
                    />
                  </div>

                  <div className="group flex items-center justify-center h-16 px-6 py-4 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-white/60 hover:scale-110 transition-all duration-500 border border-gray-200/50 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10">
                    <LogoImage
                      company="fidelity"
                      alt="Fidelity"
                      fallbackText="Fidelity"
                      className="h-10 w-auto opacity-70 group-hover:opacity-100 transition-all duration-300 filter group-hover:brightness-110"
                    />
                  </div>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* AI Intelligence Showcase Section - Moved to top */}
      <section id="intelligence" className="px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-br from-white via-emerald-50 to-green-50 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-2000"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-sm font-medium mb-8 border border-emerald-200 shadow-lg shadow-emerald-500/10">
              <Brain className="w-4 h-4 mr-2" />
              <span className="flex items-center">
                AI-Powered Intelligence Platform
                <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
              </span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="animate-fade-in-up">Transform data into</span>
              <span className="block bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent animate-gradient-x">
                profitable intelligence
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed">
              Watch our AI extract insights from millions of data points, 
              <span className="text-emerald-600 font-semibold">predict optimal ad placements</span>, and 
              <span className="text-emerald-600 font-semibold">maximize your ROI in real-time</span>.
            </p>
          </div>
          
          {/* Interactive AI Intelligence Dashboard */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Database className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Data Extraction & Analysis</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Our AI processes millions of data points from social media, news, market trends, and competitor analysis to identify the perfect advertising opportunities.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Intelligent Ad Placement</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Machine learning algorithms predict the highest-converting ad placements based on audience behavior, timing, and contextual relevance.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Profit Optimization</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Real-time decision making that automatically adjusts campaigns to maximize ROI, reduce waste, and increase profitability by up to 340%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Interactive AI Dashboard Visualization */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200/60 relative overflow-hidden">
                {/* AI Dashboard Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">AI Intelligence Center</h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-emerald-600">Live Analysis Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">+340%</div>
                    <div className="text-xs text-gray-500">ROI Increase</div>
                  </div>
                </div>
                
                {/* Data Extraction Visualization */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <Database className="w-4 h-4 mr-2 text-emerald-600" />
                        Data Sources Analyzed
                      </span>
                      <span className="text-lg font-bold text-emerald-600">2.4M</span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full animate-pulse" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                  
                  {/* Ad Placement Predictions */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-gray-900 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-blue-600" />
                      Optimal Ad Placements Identified
                    </h5>
                    {[
                      { platform: 'LinkedIn Tech Posts', score: 96, revenue: '$12.4K' },
                      { platform: 'Industry Forums', score: 89, revenue: '$8.7K' },
                      { platform: 'Financial Blogs', score: 84, revenue: '$6.2K' }
                    ].map((placement, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {placement.score}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{placement.platform}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600">{placement.revenue}</div>
                          <div className="text-xs text-gray-500">Est. Revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Profit Impact Visualization */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                        Campaign Performance
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Real-time</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-purple-600">87%</div>
                        <div className="text-xs text-gray-500">Click Rate</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">$0.23</div>
                        <div className="text-xs text-gray-500">Cost/Click</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">4.2x</div>
                        <div className="text-xs text-gray-500">ROAS</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating AI indicators */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-bounce">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Decision Making Process */}
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              How AI <span className="text-emerald-600">Maximizes Your Profits</span>
            </h3>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Database, title: 'Extract', desc: 'Analyze millions of data points' },
                { icon: Brain, title: 'Process', desc: 'AI identifies patterns & opportunities' },
                { icon: Target, title: 'Predict', desc: 'Forecast optimal placements' },
                { icon: TrendingUp, title: 'Profit', desc: 'Maximize ROI automatically' }
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-900 mb-2">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full">
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-emerald-500 animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Demo Section with AI Dashboard */}
      <section id="demo" className="px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 relative overflow-hidden">
        {/* Enhanced gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-teal-500/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)] animate-pulse"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium mb-8">
                <Zap className="w-4 h-4 mr-2" />
                SMARTER MOVES START HERE
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
                See market trends
                <span className="block text-gray-300">before they emerge</span>
              </h2>

              <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                Stay ahead with real-time financial intelligence across markets, sectors,
                and investment opportunities.
              </p>

              <Button size="lg" className="px-8 py-4 text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg">
                Reveal market insights
              </Button>
            </div>

            <div className="relative">
              {/* Enhanced AI Dashboard Mockup */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105 relative overflow-hidden">
                {/* AI particles background */}
                <div className="absolute inset-0 ai-particles opacity-30"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse animation-delay-300"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse animation-delay-500"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <div className="text-sm text-gray-500 font-medium">AI Financial Intelligence</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100 animate-glow">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse"></div>
                        <span className="text-sm font-medium flex items-center">
                          <Bot className="w-4 h-4 mr-2 text-emerald-600" />
                          AAPL AI Signal
                        </span>
                      </div>
                      <span className="text-emerald-600 font-bold text-lg">+2.4%</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                        <span className="text-sm font-medium flex items-center">
                          <Cpu className="w-4 h-4 mr-2 text-blue-600" />
                          Neural Sentiment
                        </span>
                      </div>
                      <span className="text-blue-600 font-bold">Bullish</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                        <span className="text-sm font-medium flex items-center">
                          <Database className="w-4 h-4 mr-2 text-purple-600" />
                          ML Prediction
                        </span>
                      </div>
                      <span className="text-purple-600 font-bold">95.7%</span>
                    </div>

                    {/* Enhanced Interactive Chart */}
                    <div className="h-24 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-lg flex items-end justify-center space-x-1 p-3 border border-gray-100">
                      <div className="w-3 bg-gradient-to-t from-emerald-400 to-emerald-300 rounded-t animate-float" style={{ height: '30%' }}></div>
                      <div className="w-3 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t animate-float animation-delay-300" style={{ height: '60%' }}></div>
                      <div className="w-3 bg-gradient-to-t from-emerald-600 to-emerald-500 rounded-t animate-float animation-delay-500" style={{ height: '80%' }}></div>
                      <div className="w-3 bg-gradient-to-t from-emerald-700 to-emerald-600 rounded-t animate-float" style={{ height: '100%' }}></div>
                      <div className="w-3 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t animate-float animation-delay-300" style={{ height: '70%' }}></div>
                      <div className="w-3 bg-gradient-to-t from-emerald-600 to-emerald-500 rounded-t animate-float animation-delay-500" style={{ height: '85%' }}></div>
                    </div>
                    
                    {/* AI Analysis indicator */}
                    <div className="text-center">
                      <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600 mr-2 animate-pulse" />
                        <span className="text-xs text-emerald-700 font-medium">Real-time AI analysis active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Floating Elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/25 animate-float">
                <TrendingUp className="w-10 h-10 text-white animate-pulse" />
              </div>

              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/25 animate-bounce">
                <Brain className="w-8 h-8 text-white" />
              </div>
              
              {/* Additional AI indicators */}
              <div className="absolute top-10 -left-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
                <Bot className="w-6 h-6 text-white" />
              </div>
              
              <div className="absolute bottom-16 -right-2 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/25 animate-bounce-subtle">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Company Mention Tracking Section */}
      <section id="mention-tracking" className="px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-900 relative overflow-hidden">
        {/* Enhanced AI background patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* AI-themed floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-500/10 rounded-full blur-xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl animate-bounce-subtle"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              {/* Premium AI badge */}
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 text-sm font-medium mb-8 animate-bounce-subtle">
                <Globe className="w-4 h-4 mr-2" />
                <span className="flex items-center">
                  AI-Powered Brand Intelligence
                  <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                </span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                <span className="animate-fade-in-up">See where your brand</span>
                <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-gradient-x">is being discussed</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed animate-fade-in-up animation-delay-300">
                Our AI monitors millions of conversations across
                <span className="text-emerald-300 font-semibold"> social media, forums, news, and reviews</span> to 
                <span className="text-emerald-300 font-semibold">track brand mentions and sentiment in real-time</span>.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Global Monitoring</h3>
                    <p className="text-gray-300">Track mentions across 50+ platforms and 40+ languages</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Sentiment Analysis</h3>
                    <p className="text-gray-300">AI-powered emotion detection and context understanding</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Opportunity Detection</h3>
                    <p className="text-gray-300">Identify engagement opportunities and crisis prevention</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="group px-8 py-4 text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-105 border border-emerald-400/50">
                <span className="flex items-center">
                  <Search className="mr-2 w-5 h-5 group-hover:animate-pulse" />
                  Start Brand Monitoring
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>
            
            {/* Enhanced Brand Monitoring Dashboard */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200/60 relative overflow-hidden transform rotate-1 hover:rotate-0 transition-all duration-500 hover:scale-105">
                {/* AI Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Globe className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Brand Intelligence Monitor</h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-600">Real-time Tracking</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">24,847</div>
                    <div className="text-xs text-gray-500">Mentions Today</div>
                  </div>
                </div>
                
                {/* Live Mentions Feed */}
                <div className="space-y-4 mb-6">
                  <h5 className="font-semibold text-gray-900 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-green-600" />
                    Live Mentions Stream
                  </h5>
                  {[
                    { platform: 'Twitter', user: '@techreview', sentiment: 'positive', text: 'Amazing AI features in the new...', time: '2m ago' },
                    { platform: 'LinkedIn', user: 'Sarah Chen', sentiment: 'neutral', text: 'Comparing different AI tools...', time: '5m ago' },
                    { platform: 'Reddit', user: 'r/technology', sentiment: 'positive', text: 'This AI platform saved us 40%...', time: '8m ago' }
                  ].map((mention, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        mention.sentiment === 'positive' ? 'bg-green-500' :
                        mention.sentiment === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'
                      } animate-pulse`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{mention.platform}</span>
                          <span className="text-xs text-gray-500">{mention.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{mention.user}</p>
                        <p className="text-sm text-gray-800">{mention.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Sentiment Analysis */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-green-600" />
                      Sentiment Analysis
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">AI-Powered</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">73%</div>
                      <div className="text-xs text-gray-500">Positive</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">21%</div>
                      <div className="text-xs text-gray-500">Neutral</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">6%</div>
                      <div className="text-xs text-gray-500">Negative</div>
                    </div>
                  </div>
                </div>
                
                {/* Engagement Opportunities */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-purple-600" />
                      Engagement Opportunities
                    </span>
                    <span className="text-lg font-bold text-purple-600">47</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">High-impact threads</span>
                      <span className="font-bold text-purple-600">12</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Influencer mentions</span>
                      <span className="font-bold text-purple-600">8</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Crisis alerts</span>
                      <span className="font-bold text-red-600">2</span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Floating AI indicators */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/25 animate-float">
                  <Search className="w-8 h-8 text-white animate-pulse" />
                </div>
                
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25 animate-bounce">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                
                <div className="absolute top-10 -left-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
                  <Brain className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Premium AI Features Section */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-24 bg-gradient-to-br from-white via-gray-50 to-emerald-50 relative overflow-hidden">
        {/* AI background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-20 left-10 w-48 h-48 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-bounce-subtle"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-sm font-medium mb-8 border border-emerald-200 shadow-lg shadow-emerald-500/10">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span className="flex items-center">
                Advanced AI Features
                <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
              </span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="animate-fade-in-up">Advanced analytics for</span>
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent block animate-gradient-x">
                financial markets
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Powerful AI-driven tools designed for financial professionals.
              <span className="text-emerald-600 font-semibold"> Analyze markets, predict trends, and make data-driven investment decisions.</span>
            </p>
          </div>

          {/* Enhanced Premium Data Insights Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* AI-Powered Analytics - Enhanced */}
            <div className="group bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border border-emerald-100 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">AI-Powered Analytics</h3>
                    <p className="text-emerald-700 text-sm font-medium">Advanced machine learning models</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-emerald-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Cpu className="w-4 h-4 mr-2 text-emerald-600" />
                      Market Sentiment Analysis
                    </span>
                    <span className="text-emerald-600 font-bold">94.2% Accuracy</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-emerald-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-emerald-600" />
                      Risk Prediction Models
                    </span>
                    <span className="text-emerald-600 font-bold">Real-time</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-emerald-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                      Portfolio Optimization
                    </span>
                    <span className="text-emerald-600 font-bold">+23% ROI</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-bounce">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Real-time Data Processing - Enhanced */}
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Real-time Processing</h3>
                    <p className="text-blue-700 text-sm font-medium">Lightning-fast data ingestion</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-blue-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Database className="w-4 h-4 mr-2 text-blue-600" />
                      Data Points Processed
                    </span>
                    <span className="text-blue-600 font-bold">2.4M/sec</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-blue-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-blue-600" />
                      API Response Time
                    </span>
                    <span className="text-blue-600 font-bold">&lt;50ms</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-blue-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-blue-600" />
                      Uptime Guarantee
                    </span>
                    <span className="text-blue-600 font-bold">99.99%</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Advanced Risk Management - Enhanced */}
            <div className="group bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl p-8 border border-purple-100 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Risk Management</h3>
                    <p className="text-purple-700 text-sm font-medium">Enterprise-grade security</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-purple-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-purple-600" />
                      Stress Testing Models
                    </span>
                    <span className="text-purple-600 font-bold">50+ Scenarios</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-purple-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-purple-600" />
                      Compliance Frameworks
                    </span>
                    <span className="text-purple-600 font-bold">SOX, GDPR</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-purple-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-purple-600" />
                      Risk Alerts
                    </span>
                    <span className="text-purple-600 font-bold">Instant</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-float">
                <Brain className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Predictive Intelligence - Enhanced */}
            <div className="group bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 border border-orange-100 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-all duration-300">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Predictive Intelligence</h3>
                    <p className="text-orange-700 text-sm font-medium">Future market insights</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-orange-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-orange-600" />
                      Forecast Accuracy
                    </span>
                    <span className="text-orange-600 font-bold">87.3%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-orange-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-orange-600" />
                      Prediction Horizon
                    </span>
                    <span className="text-orange-600 font-bold">30 Days</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/80 rounded-xl backdrop-blur-sm border border-orange-100 group-hover:bg-white transition-all duration-300">
                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                      <Database className="w-4 h-4 mr-2 text-orange-600" />
                      Market Indicators
                    </span>
                    <span className="text-orange-600 font-bold">500+</span>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-bounce-subtle">
                <Target className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Card-Based CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-emerald-50 relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float animation-delay-2000"></div>
        
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-900 border-0 shadow-2xl shadow-gray-900/25 overflow-hidden relative">
            {/* Card background patterns */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            {/* AI-themed floating elements inside card */}
            <div className="absolute top-8 right-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl animate-float"></div>
            <div className="absolute bottom-8 left-8 w-24 h-24 bg-green-500/10 rounded-full blur-xl animate-float animation-delay-2000"></div>
            
            <CardContent className="p-12 md:p-16 text-center relative z-10">
              {/* Premium AI badge */}
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 text-sm font-medium mb-8 animate-bounce-subtle">
                <Bot className="w-4 h-4 mr-2" />
                <span className="flex items-center">
                  Next-generation AI • Enterprise Ready
                  <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                </span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
                <span className="animate-fade-in-up">Ready to transform</span>
                <span className="block bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-gradient-x">your financial intelligence?</span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-300">
                Join over 10,000 financial professionals already using our AI-powered platform to
                <span className="text-emerald-300 font-semibold"> predict markets, optimize portfolios, and maximize returns.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 animate-fade-in-up animation-delay-500">
                <Button size="lg" className="group px-8 py-4 text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-105 border border-emerald-400/50" asChild>
                  <Link href="/auth/signin">
                    <span className="flex items-center">
                      <Zap className="mr-2 w-5 h-5 group-hover:animate-pulse" />
                      Start AI Analysis
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="px-8 py-4 text-lg text-white hover:text-emerald-100 hover:bg-emerald-500/20 border border-white/20 hover:border-emerald-400/50 backdrop-blur-sm transition-all duration-300" asChild>
                  <Link href="#contact">
                    <span className="flex items-center">
                      <Target className="mr-2 w-5 h-5" />
                      Book AI Demo
                    </span>
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-emerald-400" />
                  <span>Enterprise-grade security</span>
                </div>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-emerald-400" />
                  <span>14-day free AI trial</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-emerald-400" />
                  <span>No credit card required</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modern AI-Themed Footer */}
      <footer className="bg-gradient-to-br from-white via-gray-50 to-emerald-50 border-t border-gray-200/60 py-20 relative overflow-hidden">
        {/* Subtle AI background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-10 left-20 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl animate-float"></div>
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-green-200 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-2000"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              {/* Enhanced AI Intelligence branding */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    AI Intelligence
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-emerald-600 font-medium">Next-gen AI Platform</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
                Transforming financial intelligence through advanced AI.
                <span className="text-emerald-600 font-semibold"> Trusted by 10,000+ professionals worldwide.</span>
              </p>
              
              {/* AI-themed social icons */}
              <div className="flex space-x-4">
                <div className="group w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 cursor-pointer">
                  <span className="text-white font-bold group-hover:animate-pulse">𝕏</span>
                </div>
                <div className="group w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-300 cursor-pointer">
                  <span className="text-white font-bold group-hover:animate-pulse">in</span>
                </div>
                <div className="group w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-gray-800/25 transition-all duration-300 cursor-pointer">
                  <span className="text-white font-bold group-hover:animate-pulse">☁</span>
                </div>
                <div className="group w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer">
                  <Bot className="w-6 h-6 text-white group-hover:animate-pulse" />
                </div>
              </div>
            </div>

            {/* AI Intelligence Features */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-emerald-600" />
                AI Features
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <Cpu className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    Neural Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <Database className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    Predictive Models
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <Target className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    Smart Optimization
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <Activity className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    Real-time Insights
                  </a>
                </li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-emerald-600" />
                Platform
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <Shield className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    Enterprise Security
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <Users className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    Team Collaboration
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <TrendingUp className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    Performance Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="group flex items-center text-gray-600 hover:text-emerald-600 transition-colors">
                    <Sparkles className="w-4 h-4 mr-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    AI Automation
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Enhanced footer bottom */}
          <div className="border-t border-gray-200/60 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                <p className="text-gray-500 text-sm font-medium">
                  © 2024 AI Intelligence Platform. Powered by advanced neural networks.
                </p>
                <div className="flex items-center space-x-2 text-xs text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">AI Systems Online</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6">
                <a href="#" className="text-gray-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Terms of Service
                </a>
                <a href="#" className="text-gray-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center">
                  <Bot className="w-4 h-4 mr-1" />
                  AI Ethics
                </a>
              </div>
            </div>
            
            {/* Quirky AI touch */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full border border-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600 mr-2 animate-pulse" />
                <span className="text-sm text-emerald-700 font-medium">
                  Built with ❤️ and 🤖 Advanced AI • Making finance smarter, one prediction at a time
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
