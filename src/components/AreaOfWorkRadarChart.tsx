import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/integrations/firebase/database';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface AreaOfWorkData {
  area: string;
  applications: number;
  interviews: number;
  offers: number;
  avgResponseTime: number;
  avgInterviewTime: number;
  successRate: number;
  fullMark: number;
}

export function AreaOfWorkRadarChart() {
  const [data, setData] = useState<AreaOfWorkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    fetchAreaOfWorkData();
  }, []);

  const fetchAreaOfWorkData = async () => {
    try {
      const rawData = await db.getProcessTimelineAnalytics();
      
      // Group by area of work and calculate comprehensive stats
      const areaStats = rawData.reduce((acc: Record<string, { 
        applications: number; 
        interviews: number; 
        offers: number;
        responseTimes: number[];
        interviewTimes: number[];
      }>, item) => {
        const area = item.area_of_work || 'Other';
        
        if (!acc[area]) {
          acc[area] = { 
            applications: 0, 
            interviews: 0, 
            offers: 0,
            responseTimes: [],
            interviewTimes: []
          };
        }
        
        acc[area].applications++;
        
        if (item.application_status === 'interview') {
          acc[area].interviews++;
        } else if (item.application_status === 'offer') {
          acc[area].offers++;
        }

        // Calculate response time
        if (item.application_sent_date && item.first_response_date) {
          const sentDate = new Date(item.application_sent_date);
          const responseDate = new Date(item.first_response_date);
          const responseTime = Math.ceil((responseDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (responseTime >= 0) {
            acc[area].responseTimes.push(responseTime);
          }
        }

        // Calculate interview time
        if (item.first_response_date && item.interview_scheduled_date) {
          const responseDate = new Date(item.first_response_date);
          const interviewDate = new Date(item.interview_scheduled_date);
          const interviewTime = Math.ceil((interviewDate.getTime() - responseDate.getTime()) / (1000 * 60 * 60 * 24));
          if (interviewTime >= 0) {
            acc[area].interviewTimes.push(interviewTime);
          }
        }
        
        return acc;
      }, {});

      // Convert to chart data format
      const chartData = Object.entries(areaStats)
        .map(([area, stats]) => {
          const avgResponseTime = stats.responseTimes.length > 0 
            ? Math.round(stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length)
            : 0;
          
          const avgInterviewTime = stats.interviewTimes.length > 0 
            ? Math.round(stats.interviewTimes.reduce((sum, time) => sum + time, 0) / stats.interviewTimes.length)
            : 0;
          
          const successRate = stats.applications > 0 
            ? Math.round(((stats.interviews + stats.offers) / stats.applications) * 100)
            : 0;

          return {
            area,
            applications: stats.applications,
            interviews: stats.interviews,
            offers: stats.offers,
            avgResponseTime,
            avgInterviewTime,
            successRate,
            fullMark: Math.max(stats.applications, 10) // Dynamic max based on highest value
          };
        })
        .sort((a, b) => b.applications - a.applications) // Sort by applications descending
        .slice(0, 8); // Show top 8 areas

      setData(chartData);
      setTotalApplications(rawData.length);
    } catch (error) {
      console.error('Error fetching area of work data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Applications: {data.applications}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Interviews: {data.interviews}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Offers: {data.offers}</span>
            </div>
            {data.avgResponseTime > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Avg Response: {data.avgResponseTime} days</span>
              </div>
            )}
            {data.avgInterviewTime > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Avg Interview Time: {data.avgInterviewTime} days</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span>Success Rate: {data.successRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="apple-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold apple-heading text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Area of Work Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-gray-600 font-medium">Loading area analysis...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="apple-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold apple-heading text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Area of Work Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No area data available</h3>
          <p className="text-gray-600 text-center text-sm">
            Add area of work information to your job applications to see this analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="apple-card border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold apple-heading text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Area of Work Analysis
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
            {totalApplications} total applications
          </Badge>
        </div>
        <p className="text-gray-600 text-sm">
          Visualizing your job applications by area of work and success rates
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Radar Chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="area" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  className="text-xs"
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'dataMax']} 
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                />
                <Radar
                  name="Applications"
                  dataKey="applications"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Interviews"
                  dataKey="interviews"
                  stroke="#eab308"
                  fill="#eab308"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Offers"
                  dataKey="offers"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Avg Response Time"
                  dataKey="avgResponseTime"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Avg Interview Time"
                  dataKey="avgInterviewTime"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Success Rate"
                  dataKey="successRate"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Applications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Interviews</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Offers</span>
            </div>
          </div>

          {/* Top Areas Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Most Applications
              </h4>
              <div className="space-y-1">
                {data.slice(0, 3).map((item, index) => (
                  <div key={item.area} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.area}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.applications} apps
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Best Success Rate
              </h4>
              <div className="space-y-1">
                {data
                  .filter(item => item.applications > 0)
                  .map(item => ({
                    ...item,
                    successRate: ((item.interviews + item.offers) / item.applications * 100).toFixed(1)
                  }))
                  .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate))
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={item.area} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.area}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.successRate}%
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
