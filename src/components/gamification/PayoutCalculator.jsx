'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Calculator,
  Zap,
  Trophy,
  Clock,
  Brain,
  Loader2,
  Info,
  Coins,
  TrendingDown,
  Shield,
  Flame
} from 'lucide-react';

export default function PayoutCalculator({ 
  prepPlan, 
  prepPlanId, 
  onPayoutCalculated,
  className = "" 
}) {
  const [stakeAmount, setStakeAmount] = useState(100);
  const [timeline, setTimeline] = useState(prepPlan?.overview?.estimatedTimeWeeks || 12);
  const [contentDifficulty, setContentDifficulty] = useState(5);
  const [userSkillLevel, setUserSkillLevel] = useState(5);
  const [payoutResult, setPayoutResult] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');

  useEffect(() => {
    if (prepPlan) {
      // Auto-calculate difficulty based on prep plan
      const estimatedDifficulty = estimateContentDifficulty(prepPlan);
      setContentDifficulty(estimatedDifficulty);
      
      // Auto-calculate initial payout
      calculatePayout();
    }
  }, [prepPlan, timeline, contentDifficulty, userSkillLevel]);

  const estimateContentDifficulty = (plan) => {
    if (!plan?.phases) return 5;
    
    // Estimate difficulty based on number of topics and AI analysis
    const totalTopics = plan.phases.reduce((sum, phase) => sum + phase.topics.length, 0);
    const hasAdvancedTopics = plan.phases.some(phase => 
      phase.topics.some(topic => 
        topic.title.toLowerCase().includes('advanced') ||
        topic.title.toLowerCase().includes('expert') ||
        topic.title.toLowerCase().includes('complex')
      )
    );
    
    let difficulty = Math.min(10, Math.max(1, totalTopics / 3));
    if (hasAdvancedTopics) difficulty += 2;
    if (plan.overview?.difficultyLevel === 'Advanced') difficulty += 1;
    
    return Math.round(Math.min(10, difficulty));
  };

  const calculatePayout = async () => {
    if (!prepPlanId) return;
    
    setCalculating(true);
    try {
      const response = await fetch('/api/payout/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prepPlanId,
          timeline,
          contentDifficulty,
          userSkillLevel,
          customizations: 0, // TODO: Get from customization state
          stakeAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPayoutResult(result.data);
        
        if (onPayoutCalculated) {
          onPayoutCalculated(result.data);
        }
      } else {
        console.error('Failed to calculate payout');
      }
    } catch (error) {
      console.error('Error calculating payout:', error);
    } finally {
      setCalculating(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const params = new URLSearchParams({
        timeline: timeline.toString(),
        contentDifficulty: contentDifficulty.toString(),
        userSkillLevel: userSkillLevel.toString(),
        customizations: '0'
      });

      const response = await fetch(`/api/payout/calculate?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setScenarios(result.data.scenarios);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return <Shield className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Flame className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return `${amount} coins`; // Virtual currency
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            Demo Betting Calculator
            <Badge variant="secondary" className="ml-2">Virtual Currency</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculate potential rewards for completing your learning plan. All betting is simulated with virtual currency.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="calculator" className="space-y-6">
              {/* Input Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Coins className="h-4 w-4" />
                      Virtual Stake Amount
                    </Label>
                    <Input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(parseInt(e.target.value) || 100)}
                      min="10"
                      max="1000"
                      step="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Amount of virtual coins to stake (10-1000)
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4" />
                      Timeline: {timeline} weeks
                    </Label>
                    <Slider
                      value={[timeline]}
                      onValueChange={(value) => setTimeline(value[0])}
                      min={2}
                      max={52}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>2 weeks</span>
                      <span>1 year</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4" />
                      Content Difficulty: {contentDifficulty}/10
                    </Label>
                    <Slider
                      value={[contentDifficulty]}
                      onValueChange={(value) => setContentDifficulty(value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4" />
                      Your Skill Level: {userSkillLevel}/10
                    </Label>
                    <Slider
                      value={[userSkillLevel]}
                      onValueChange={(value) => setUserSkillLevel(value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={calculatePayout} 
                disabled={calculating}
                className="w-full"
              >
                {calculating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Payout
                  </>
                )}
              </Button>

              {/* Results */}
              {payoutResult && (
                <div className="space-y-4">
                  {/* Main Payout Display */}
                  <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-purple-600">
                          {payoutResult.finalMultiplier}x
                        </div>
                        <div className="text-sm text-muted-foreground">Payout Multiplier</div>
                        <div className="text-xl font-semibold">
                          Win: {formatCurrency(payoutResult.potentialWinnings.expected)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          From {formatCurrency(stakeAmount)} stake
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold">Risk Assessment</h4>
                        <Badge 
                          variant="outline" 
                          className={getRiskColor(payoutResult.riskAssessment.riskLevel)}
                        >
                          {getRiskIcon(payoutResult.riskAssessment.riskLevel)}
                          {payoutResult.riskAssessment.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {payoutResult.riskAssessment.riskDescription}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Success Probability:</span>
                          <div className="text-lg font-bold text-green-600">
                            {Math.round(payoutResult.riskAssessment.successProbability * 100)}%
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span>
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round(payoutResult.confidence * 100)}%
                          </div>
                        </div>
                      </div>

                      {payoutResult.riskAssessment.riskFactors.length > 0 && (
                        <div className="mt-4">
                          <span className="font-medium text-sm">Risk Factors:</span>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {payoutResult.riskAssessment.riskFactors.map((factor, index) => (
                              <li key={index}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Potential Winnings Range */}
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4">Potential Winnings Range</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {formatCurrency(payoutResult.potentialWinnings.conservative)}
                          </div>
                          <div className="text-xs text-muted-foreground">Conservative</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(payoutResult.potentialWinnings.expected)}
                          </div>
                          <div className="text-xs text-muted-foreground">Expected</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {formatCurrency(payoutResult.potentialWinnings.optimistic)}
                          </div>
                          <div className="text-xs text-muted-foreground">Optimistic</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  {payoutResult.recommendations.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-4">Recommendations</h4>
                        <div className="space-y-3">
                          {payoutResult.recommendations.map((rec, index) => (
                            <div key={index} className="border-l-4 border-blue-200 pl-4">
                              <p className="text-sm font-medium">{rec.message}</p>
                              <p className="text-xs text-muted-foreground">{rec.impact}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Compare Scenarios</h3>
                <Button variant="outline" onClick={loadScenarios}>
                  Load Scenarios
                </Button>
              </div>

              {scenarios.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {scenarios.map((scenario, index) => (
                    <Card key={index} className="relative">
                      <CardHeader>
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {scenario.result.finalMultiplier}x
                            </div>
                            <div className="text-sm text-muted-foreground">Multiplier</div>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Timeline:</span>
                              <span>{scenario.params.timeline} weeks</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk:</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRiskColor(scenario.result.riskAssessment.riskLevel)}`}
                              >
                                {scenario.result.riskAssessment.riskLevel}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Success Rate:</span>
                              <span>{Math.round(scenario.result.riskAssessment.successProbability * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-4">
              {payoutResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Calculation Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(payoutResult.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-mono">{value}x</span>
                        </div>
                      ))}
                      <hr />
                      <div className="flex justify-between items-center font-bold">
                        <span>Final Multiplier:</span>
                        <span className="font-mono text-purple-600">{payoutResult.finalMultiplier}x</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}