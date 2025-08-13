'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Flask, 
  PlayCircle, 
  CheckCircle, 
  DollarSign, 
  Target,
  Timer,
  Brain,
  Settings
} from 'lucide-react';
import { 
  isDevelopmentMode, 
  generateTestCompletionData, 
  getTestScenarios,
  calculateTestPayout 
} from '@/utils/testingUtils';

export default function BettingTestingPanel({ 
  videos = [], 
  betAmount, 
  aiEstimatedTime, 
  challengeTime,
  onTestComplete 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Don't show in production
  if (!isDevelopmentMode()) {
    return null;
  }

  const scenarios = getTestScenarios();

  const runTestScenario = async (scenarioKey) => {
    setIsRunningTest(true);
    
    try {
      // Generate test completion data for all videos
      const testCompletions = {};
      
      videos.forEach((video, index) => {
        const videoKey = video.url || `video-${index}`;
        testCompletions[videoKey] = generateTestCompletionData(
          scenarioKey,
          betAmount,
          aiEstimatedTime,
          challengeTime
        );
      });

      // Calculate expected payout
      const testPayout = calculateTestPayout(
        betAmount, 
        testCompletions[Object.keys(testCompletions)[0]], 
        aiEstimatedTime, 
        challengeTime
      );

      setTestResults({
        scenario: scenarioKey,
        completions: testCompletions,
        payout: testPayout,
        expectedProfit: testPayout ? testPayout.profit : 0,
        timestamp: new Date().toISOString()
      });

      // Call the callback to update the main component
      if (onTestComplete) {
        onTestComplete(testCompletions, testPayout);
      }

    } catch (error) {
      console.error('Test scenario failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  const clearTestResults = () => {
    setTestResults(null);
    if (onTestComplete) {
      onTestComplete({}, null);
    }
  };

  return (
    <Card className="border-2 border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-orange-800 dark:text-orange-200">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-md">
            <Flask className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">Betting System Testing Panel</div>
            <p className="text-sm font-normal text-orange-600 dark:text-orange-400 mt-1">
              Development mode only - Test betting scenarios without watching videos
            </p>
          </div>
        </CardTitle>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(!isVisible)}
          className="w-fit"
        >
          <Settings className="h-4 w-4 mr-2" />
          {isVisible ? 'Hide' : 'Show'} Testing Options
        </Button>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="space-y-6">
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">How Testing Works:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Click any scenario button to instantly "complete" all videos</li>
                  <li><strong>Break Even</strong> gives you exactly your bet money back (no profit, no loss)</li>
                  <li>Other scenarios test different quality scores and payouts</li>
                  <li>No need to actually watch videos - perfect for development testing!</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Current Bet Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border">
            <div className="text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">Bet Amount</p>
              <p className="font-bold text-green-600">{betAmount || '0'} EDU</p>
            </div>
            <div className="text-center">
              <Timer className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">AI Time</p>
              <p className="font-bold text-blue-600">{Math.round((aiEstimatedTime || 0) / 60)}m</p>
            </div>
            <div className="text-center">
              <Target className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-xs text-muted-foreground">Challenge</p>
              <p className="font-bold text-purple-600">{Math.round((challengeTime || 0) / 60)}m</p>
            </div>
          </div>

          {/* Test Scenarios */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Test Scenarios
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(scenarios).map(([key, scenario]) => (
                <Button
                  key={key}
                  variant={key === 'breakEven' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => runTestScenario(key)}
                  disabled={isRunningTest || !betAmount}
                  className={`text-left h-auto p-4 ${key === 'breakEven' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      <span className="font-medium">{scenario.name}</span>
                      {key === 'breakEven' && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-90">{scenario.description}</p>
                    <div className="flex gap-2 text-xs">
                      <span>Multiplier: {scenario.expectedMultiplier}</span>
                      <span>•</span>
                      <span>Profit: {scenario.expectedProfit}</span>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Test Results
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearTestResults}
                >
                  Clear Results
                </Button>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Scenario: {scenarios[testResults.scenario]?.name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {scenarios[testResults.scenario]?.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600 dark:text-green-400">Videos Completed</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">
                      {Object.keys(testResults.completions).length}/{videos.length}
                    </p>
                  </div>
                </div>

                {testResults.payout && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-white dark:bg-slate-800 rounded border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Final Payout</p>
                      <p className="font-bold text-green-600">
                        {testResults.payout.finalPayout.toFixed(4)} EDU
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Multiplier</p>
                      <p className="font-bold text-blue-600">
                        {testResults.payout.multiplier.toFixed(2)}x
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Profit/Loss</p>
                      <p className={`font-bold ${testResults.payout.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {testResults.payout.profit >= 0 ? '+' : ''}{testResults.payout.profit.toFixed(4)} EDU
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                  ✅ All videos marked as completed with scenario-appropriate quality scores
                </div>
              </div>
            </div>
          )}

          {/* Disabled state message */}
          {!betAmount && (
            <Alert>
              <AlertDescription>
                Place a bet first to enable testing scenarios
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}
