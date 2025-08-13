'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  TrendingUp,
  Trophy,
  Calendar,
  Clock,
  Coins,
  Target,
  Award,
  BarChart3,
  Eye,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function EarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsHistory();
  }, []);

  const loadEarningsHistory = async () => {
    try {
      // For now, we'll use mock data
      // In production, this would fetch from your blockchain/backend
      const mockEarnings = [
        {
          id: 1,
          courseTitle: "React Advanced Patterns",
          company: "TechCorp",
          stakeAmount: 0.005,
          challengeTime: 120, // minutes
          aiEstimatedTime: 150,
          actualTime: 110,
          qualityScore: 92,
          multiplier: 1.8,
          payout: 0.009,
          profit: 0.004,
          status: 'completed',
          completedAt: new Date('2025-08-10'),
          betId: '0x123...abc'
        },
        {
          id: 2,
          courseTitle: "Node.js Microservices",
          company: "StartupXYZ",
          stakeAmount: 0.001,
          challengeTime: 180,
          aiEstimatedTime: 200,
          actualTime: 175,
          qualityScore: 88,
          multiplier: 1.4,
          payout: 0.0014,
          profit: 0.0004,
          status: 'completed',
          completedAt: new Date('2025-08-08'),
          betId: '0x456...def'
        },
        {
          id: 3,
          courseTitle: "Python Data Science",
          company: "DataInc",
          stakeAmount: 0.01,
          challengeTime: 300,
          aiEstimatedTime: 360,
          actualTime: 290,
          qualityScore: 95,
          multiplier: 2.2,
          payout: 0.022,
          profit: 0.012,
          status: 'completed',
          completedAt: new Date('2025-08-05'),
          betId: '0x789...ghi'
        }
      ];

      setEarnings(mockEarnings);
      const total = mockEarnings.reduce((sum, earning) => sum + earning.profit, 0);
      setTotalEarnings(total);
      setLoading(false);
    } catch (error) {
      console.error('Error loading earnings:', error);
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Learning Earnings</h1>
              <p className="text-muted-foreground">
                Track your blockchain betting performance and rewards
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Coins className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">
                +{totalEarnings.toFixed(4)} EDU
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-sm text-muted-foreground">Completed Bets</p>
              <p className="text-2xl font-bold">
                {earnings.filter(e => e.status === 'completed').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">
                {earnings.length > 0 ? ((earnings.filter(e => e.status === 'completed').length / earnings.length) * 100).toFixed(0) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-muted-foreground">Avg Quality Score</p>
              <p className="text-2xl font-bold">
                {earnings.length > 0 ? (earnings.reduce((sum, e) => sum + e.qualityScore, 0) / earnings.length).toFixed(0) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Earnings History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No earnings yet</p>
                <p className="text-muted-foreground mb-4">
                  Start placing learning bets to track your performance!
                </p>
                <Button onClick={() => router.push('/dashboard/applicant/video-plan')}>
                  Create Learning Plan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {earnings.map((earning) => (
                  <Card key={earning.id} className="border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {earning.courseTitle}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {earning.company}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {earning.completedAt.toLocaleDateString()}
                            </div>
                            <Badge className={getStatusColor(earning.status)}>
                              {earning.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            +{earning.profit.toFixed(4)} EDU
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {earning.multiplier.toFixed(1)}x multiplier
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-muted rounded">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                          <p className="text-xs text-muted-foreground">Challenge</p>
                          <p className="font-medium">{formatTime(earning.challengeTime)}</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <Target className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                          <p className="text-xs text-muted-foreground">Actual</p>
                          <p className="font-medium">{formatTime(earning.actualTime)}</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <Eye className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                          <p className="text-xs text-muted-foreground">Quality</p>
                          <p className="font-medium">{earning.qualityScore}%</p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <Coins className="h-5 w-5 mx-auto mb-1 text-green-600" />
                          <p className="text-xs text-muted-foreground">Stake</p>
                          <p className="font-medium">{earning.stakeAmount.toFixed(4)} EDU</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Performance vs Challenge</span>
                          <span className="text-green-600">
                            {((earning.challengeTime - earning.actualTime) / earning.challengeTime * 100).toFixed(1)}% faster
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(((earning.challengeTime - earning.actualTime) / earning.challengeTime * 100), 100)} 
                          className="h-2"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Bet ID: {earning.betId}
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
