import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

interface ReviewHistoryData {
  date: string;
  learned: number;
  reviewed: number;
  totalReviews: number;
  averageRecall?: number;
}

interface UpcomingReviewData {
  date: string;
  count: number;
}

interface ReviewHistoryChartProps {
  reviewHistory: ReviewHistoryData[];
  upcomingReviews: UpcomingReviewData[];
  totalCards: number;
  masteredCards: number;
  learningCards: number;
}

/**
 * Component that visualizes the user's flashcard review history
 * and upcoming review schedule using charts
 */
export const ReviewHistoryChart: React.FC<ReviewHistoryChartProps> = ({
  reviewHistory,
  upcomingReviews,
  totalCards,
  masteredCards,
  learningCards
}) => {
  const [activeTab, setActiveTab] = useState('activity');

  // Format dates for better display
  const formattedHistory = useMemo(() => {
    return reviewHistory.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('pl-PL', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  }, [reviewHistory]);

  const formattedUpcoming = useMemo(() => {
    return upcomingReviews.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('pl-PL', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  }, [upcomingReviews]);

  // Calculate mastery percentage
  const masteryPercentage = totalCards > 0 
    ? Math.round((masteredCards / totalCards) * 100) 
    : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Historia nauki</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="activity">Aktywność</TabsTrigger>
            <TabsTrigger value="upcoming">Nadchodzące powtórki</TabsTrigger>
            <TabsTrigger value="mastery">Postęp nauki</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedHistory} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    const label = name === 'learned' 
                      ? 'Przyswojone'
                      : name === 'reviewed'
                        ? 'Do powtórki'
                        : 'Łącznie';
                    return [`${value} fiszek`, label];
                  }}
                />
                <Bar 
                  dataKey="learned" 
                  name="Learned" 
                  stackId="a" 
                  fill="#10b981" 
                />
                <Bar 
                  dataKey="reviewed" 
                  name="Reviewed" 
                  stackId="a" 
                  fill="#f59e0b" 
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="upcoming" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedUpcoming} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`${value} fiszek`, 'Do powtórki']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="mastery" className="h-80">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#e5e7eb" 
                    strokeWidth="10" 
                  />
                  
                  {/* Progress arc - stroke-dasharray and stroke-dashoffset control the arc */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                    strokeDasharray={`${masteryPercentage * 2.83} 283`} 
                    strokeDashoffset="70.75" 
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{masteryPercentage}%</span>
                  <span className="text-sm text-muted-foreground">Opanowano</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-8">
                <div className="text-center">
                  <p className="text-2xl font-semibold">{masteredCards}</p>
                  <p className="text-sm text-muted-foreground">Opanowane</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold">{learningCards}</p>
                  <p className="text-sm text-muted-foreground">W trakcie nauki</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 