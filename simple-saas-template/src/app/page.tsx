import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoImage } from "@/components/ui/logo-image";
import { Check, Zap, Shield, Brain, TrendingUp, ArrowRight, Star, Users, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-emerald-50/30"></div>

          <div className="relative text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-8">
                <Star className="w-4 h-4 mr-2" />
                Trusted by 10,000+ businesses worldwide
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight text-gray-900">
                AI-powered insights for
                <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  financial intelligence
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Transform financial data into actionable insights with advanced AI.
                Analyze markets, predict trends, and make smarter investment decisions.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Button size="lg" className="px-8 py-4 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" asChild>
                  <Link href="/auth/signin">
                    Start free trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg text-gray-700 hover:bg-gray-50 border-gray-300" asChild>
                  <Link href="#demo">
                    Watch demo
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

              {/* Company Logos */}
              <div className="max-w-4xl mx-auto">
                <p className="text-center text-gray-500 text-sm mb-8 font-medium">
                  Trusted by leading financial institutions
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                  {/* Using proper brand logos */}
                  <div className="flex items-center justify-center h-12 hover:scale-105 transition-transform duration-300">
                    <LogoImage
                      company="goldman-sachs"
                      alt="Goldman Sachs"
                      fallbackText="Goldman Sachs"
                      className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-center h-12 hover:scale-105 transition-transform duration-300">
                    <LogoImage
                      company="jpmorgan"
                      alt="JPMorgan Chase"
                      fallbackText="JPMorgan"
                      className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-center h-12 hover:scale-105 transition-transform duration-300">
                    <LogoImage
                      company="morgan-stanley"
                      alt="Morgan Stanley"
                      fallbackText="Morgan Stanley"
                      className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-center h-12 hover:scale-105 transition-transform duration-300">
                    <LogoImage
                      company="blackrock"
                      alt="BlackRock"
                      fallbackText="BlackRock"
                      className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-center h-12 hover:scale-105 transition-transform duration-300">
                    <LogoImage
                      company="vanguard"
                      alt="Vanguard"
                      fallbackText="Vanguard"
                      className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-center h-12 hover:scale-105 transition-transform duration-300">
                    <LogoImage
                      company="fidelity"
                      alt="Fidelity"
                      fallbackText="Fidelity"
                      className="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Second Hero Section with Mockup */}
      <section id="demo" className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>

            <div className="relative grid lg:grid-cols-2 gap-16 items-center">
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
                {/* Mockup Dashboard */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm text-gray-500">Financial Dashboard</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium">AAPL Stock Alert</span>
                      </div>
                      <span className="text-emerald-600 font-bold">+2.4%</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium">Market Sentiment</span>
                      </div>
                      <span className="text-green-600 font-bold">Bullish</span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium">AI Prediction</span>
                      </div>
                      <span className="text-teal-600 font-bold">95% Conf.</span>
                    </div>

                    {/* Mini Chart */}
                    <div className="h-20 bg-gray-50 rounded-lg flex items-end justify-center space-x-1 p-2">
                      <div className="w-2 bg-emerald-300 rounded-t" style={{ height: '30%' }}></div>
                      <div className="w-2 bg-emerald-400 rounded-t" style={{ height: '60%' }}></div>
                      <div className="w-2 bg-emerald-500 rounded-t" style={{ height: '80%' }}></div>
                      <div className="w-2 bg-emerald-600 rounded-t" style={{ height: '100%' }}></div>
                      <div className="w-2 bg-emerald-500 rounded-t" style={{ height: '70%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>

                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Graphics Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-8">
                <Star className="w-4 h-4 mr-2" />
                SMART EXTRAS AHEAD
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Features built to
                <span className="block">scale your portfolio</span>
              </h2>

              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Data-backed tools designed to make your investing smarter.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Market Intelligence Analytics</h3>
                <p className="text-lg text-gray-600 mb-8">
                  Analyze your portfolio performance and market trends in one place.
                  Spot opportunities, compare competitors, and find winning strategies faster.
                </p>

                {/* Animated Chart Mockup */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Current Portfolio Performance</h4>
                    <div className="flex space-x-2">
                      <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Organic</div>
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Paid</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 h-32 items-end">
                    <div className="bg-orange-200 rounded-t animate-pulse" style={{ height: '40%' }}></div>
                    <div className="bg-orange-300 rounded-t animate-pulse" style={{ height: '60%', animationDelay: '0.2s' }}></div>
                    <div className="bg-orange-400 rounded-t animate-pulse" style={{ height: '80%', animationDelay: '0.4s' }}></div>
                    <div className="bg-orange-500 rounded-t animate-pulse" style={{ height: '100%', animationDelay: '0.6s' }}></div>
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    Portfolio value increased by 23% this quarter
                  </div>
                </div>
              </div>

              <div>
                {/* Competitor Analysis Mockup */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-gray-900">Market Leaders</h4>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">G</span>
                      </div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Apple Inc.</span>
                      <div className="flex items-center">
                        <div className="w-16 h-2 bg-gray-200 rounded-full mr-3">
                          <div className="w-12 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-sm font-medium">$175.43</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Microsoft Corp.</span>
                      <div className="flex items-center">
                        <div className="w-16 h-2 bg-gray-200 rounded-full mr-3">
                          <div className="w-10 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        <span className="text-sm font-medium">$342.56</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tesla Inc.</span>
                      <div className="flex items-center">
                        <div className="w-16 h-2 bg-gray-200 rounded-full mr-3">
                          <div className="w-14 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                        </div>
                        <span className="text-sm font-medium">$248.87</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Advanced analytics for
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent block">
                financial markets
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful AI-driven tools designed for financial professionals.
              Analyze markets, predict trends, and make data-driven investment decisions.
            </p>
          </div>

          {/* Premium Data Insights Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* AI-Powered Analytics */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mr-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">AI-Powered Analytics</h3>
                  <p className="text-emerald-700 text-sm">Advanced machine learning models</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Market Sentiment Analysis</span>
                  <span className="text-emerald-600 font-bold text-sm">94.2% Accuracy</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Risk Prediction Models</span>
                  <span className="text-emerald-600 font-bold text-sm">Real-time</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Portfolio Optimization</span>
                  <span className="text-emerald-600 font-bold text-sm">+23% ROI</span>
                </div>
              </div>
            </div>

            {/* Real-time Data Processing */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Real-time Processing</h3>
                  <p className="text-blue-700 text-sm">Lightning-fast data ingestion</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Data Points Processed</span>
                  <span className="text-blue-600 font-bold text-sm">2.4M/sec</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">API Response Time</span>
                  <span className="text-blue-600 font-bold text-sm">&lt;50ms</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Uptime Guarantee</span>
                  <span className="text-blue-600 font-bold text-sm">99.99%</span>
                </div>
              </div>
            </div>

            {/* Advanced Risk Management */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Risk Management</h3>
                  <p className="text-purple-700 text-sm">Enterprise-grade security</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Stress Testing Models</span>
                  <span className="text-purple-600 font-bold text-sm">50+ Scenarios</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Compliance Frameworks</span>
                  <span className="text-purple-600 font-bold text-sm">SOX, GDPR</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Risk Alerts</span>
                  <span className="text-purple-600 font-bold text-sm">Instant</span>
                </div>
              </div>
            </div>

            {/* Predictive Intelligence */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mr-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Predictive Intelligence</h3>
                  <p className="text-orange-700 text-sm">Future market insights</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Forecast Accuracy</span>
                  <span className="text-orange-600 font-bold text-sm">87.3%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Prediction Horizon</span>
                  <span className="text-orange-600 font-bold text-sm">30 Days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-700">Market Indicators</span>
                  <span className="text-orange-600 font-bold text-sm">500+</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-sm">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Simple pricing that
                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent block">
                  grows with you
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Start free, scale as you grow. No hidden fees, no surprises.
                Cancel anytime with just one click.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 relative">
                <CardHeader className="text-center p-8">
                  <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">Starter</CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">$29</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                  <CardDescription className="text-gray-600 text-lg">
                    Perfect for small teams and startups getting started
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Up to 5,000 API calls/month
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Basic analytics dashboard
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Email support
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Standard integrations
                    </li>
                  </ul>
                  <Button className="w-full py-3 text-lg" variant="outline" asChild>
                    <Link href="/auth/signin">Start free trial</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-500 relative shadow-lg scale-105">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
                <CardHeader className="text-center p-8">
                  <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">Professional</CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">$99</span>
                    <span className="text-gray-600 ml-2">/month</span>
                  </div>
                  <CardDescription className="text-gray-600 text-lg">
                    For growing businesses that need advanced features
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Up to 50,000 API calls/month
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Advanced analytics & insights
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Priority support
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Custom integrations
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      Team collaboration tools
                    </li>
                  </ul>
                  <Button className="w-full py-3 text-lg bg-emerald-600 hover:bg-emerald-700" asChild>
                    <Link href="/auth/signin">Start free trial</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                <CardHeader className="text-center p-8">
                  <CardTitle className="text-2xl font-semibold text-gray-900 mb-2">Enterprise</CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">Custom</span>
                  </div>
                  <CardDescription className="text-gray-600 text-lg">
                    For large organizations with specific requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                      Unlimited API calls
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                      White-label solution
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                      Dedicated support manager
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                      Custom deployment options
                    </li>
                    <li className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                      SLA guarantees
                    </li>
                  </ul>
                  <Button className="w-full py-3 text-lg" variant="outline" asChild>
                    <Link href="/auth/signin">Contact sales</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to transform
            <span className="block">your business?</span>
          </h2>
          <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join over 10,000 companies already using our platform to automate workflows,
            gain insights, and accelerate growth. Start your free trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button size="lg" className="px-8 py-4 text-lg bg-white text-indigo-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200" asChild>
              <Link href="/auth/signin">
                Start free trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="px-8 py-4 text-lg text-white hover:text-indigo-100 hover:bg-white/10" asChild>
              <Link href="#contact">
                Talk to sales
              </Link>
            </Button>
          </div>

          <p className="text-indigo-200 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                SaaS Template
              </h3>
              <p className="text-gray-400 mb-6 max-w-md text-lg leading-relaxed">
                Building the future of intelligent business automation.
                Trusted by thousands of companies worldwide.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold">T</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold">L</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold">G</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 SaaS Template. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
