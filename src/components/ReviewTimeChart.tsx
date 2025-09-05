import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/integrations/firebase/database';
import { Clock, TrendingUp, Calendar, Timer, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO, differenceInDays, min, max, eachDayOfInterval } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface ProcessTimelineData {
  date: string;
  avgResponseTime: number;
  avgInterviewTime: number;
  avgDecisionTime: number;
  totalApplications: number;
  pendingApplications: number;
}

interface ProcessStats {
  avgResponseTime: number;
  avgInterviewTime: number;
  avgDecisionTime: number;
  totalApplications: number;
  pendingApplications: number;
  fastestResponse: number;
  slowestResponse: number;
}

export function ReviewTimeChart() {
  const [chartData, setChartData] = useState<ProcessTimelineData[]>([]);
  const [stats, setStats] = useState<ProcessStats>({
    avgResponseTime: 0,
    avgInterviewTime: 0,
    avgDecisionTime: 0,
    totalApplications: 0,
    pendingApplications: 0,
    fastestResponse: 0,
    slowestResponse: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProcessTimelineData();
  }, []);

  const fetchProcessTimelineData = async () => {
    setLoading(true);
    try {
      const data = await db.getProcessTimelineAnalytics();

      if (!data || data.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      // Calculate date range from first application to now
      const applicationDates = data.map(app => parseISO(app.application_date));
      const earliestDate = min(applicationDates);
      const latestDate = max(applicationDates);
      const endDate = latestDate > new Date() ? latestDate : new Date();
      
      const allDays = eachDayOfInterval({ start: earliestDate, end: endDate });
      
      // Calculate process timing statistics
      const processStats = calculateProcessStats(data);
      setStats(processStats);

      // Create chart data
      const chartData: ProcessTimelineData[] = allDays.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayApplications = data.filter(app => app.application_date === dayStr);
        
        // Calculate average times for this day
        const responseTimes = dayApplications
          .filter(app => app.application_sent_date && app.first_response_date)
          .map(app => {
            const sentDate = parseISO(app.application_sent_date);
            const responseDate = parseISO(app.first_response_date);
            return differenceInDays(responseDate, sentDate);
          })
          .filter(days => days >= 0);

        const interviewTimes = dayApplications
          .filter(app => app.first_response_date && app.interview_scheduled_date)
          .map(app => {
            const responseDate = parseISO(app.first_response_date);
            const interviewDate = parseISO(app.interview_scheduled_date);
            return differenceInDays(interviewDate, responseDate);
          })
          .filter(days => days >= 0);

        const decisionTimes = dayApplications
          .filter(app => app.interview_completed_date && (app.offer_received_date || app.rejection_date))
          .map(app => {
            const interviewDate = parseISO(app.interview_completed_date);
            const decisionDate = parseISO(app.offer_received_date || app.rejection_date);
            return differenceInDays(decisionDate, interviewDate);
          })
          .filter(days => days >= 0);

        // Count pending applications (applied but no final decision)
        const pendingApplications = data.filter(app => 
          parseISO(app.application_date) <= day && 
          app.application_status === 'applied' &&
          !app.rejection_date && 
          !app.offer_received_date && 
          !app.withdrawal_date
        ).length;

        return {
          date: format(day, 'MMM dd'),
          avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((sum, days) => sum + days, 0) / responseTimes.length) : 0,
          avgInterviewTime: interviewTimes.length > 0 ? Math.round(interviewTimes.reduce((sum, days) => sum + days, 0) / interviewTimes.length) : 0,
          avgDecisionTime: decisionTimes.length > 0 ? Math.round(decisionTimes.reduce((sum, days) => sum + days, 0) / decisionTimes.length) : 0,
          totalApplications: dayApplications.length,
          pendingApplications
        };
      });

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching process timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProcessStats = (data: any[]): ProcessStats => {
    const responseTimes = data
      .filter(app => app.application_sent_date && app.first_response_date)
      .map(app => {
        const sentDate = parseISO(app.application_sent_date);
        const responseDate = parseISO(app.first_response_date);
        return differenceInDays(responseDate, sentDate);
      })
      .filter(days => days >= 0);

    const interviewTimes = data
      .filter(app => app.first_response_date && app.interview_scheduled_date)
      .map(app => {
        const responseDate = parseISO(app.first_response_date);
        const interviewDate = parseISO(app.interview_scheduled_date);
        return differenceInDays(interviewDate, responseDate);
      })
      .filter(days => days >= 0);

    const decisionTimes = data
      .filter(app => app.interview_completed_date && (app.offer_received_date || app.rejection_date))
      .map(app => {
        const interviewDate = parseISO(app.interview_completed_date);
        const decisionDate = parseISO(app.offer_received_date || app.rejection_date);
        return differenceInDays(decisionDate, interviewDate);
      })
      .filter(days => days >= 0);

    const pendingApplications = data.filter(app => 
      app.application_status === 'applied' &&
      !app.rejection_date && 
      !app.offer_received_date && 
      !app.withdrawal_date
    ).length;

    return {
      avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((sum, days) => sum + days, 0) / responseTimes.length) : 0,
      avgInterviewTime: interviewTimes.length > 0 ? Math.round(interviewTimes.reduce((sum, days) => sum + days, 0) / interviewTimes.length) : 0,
      avgDecisionTime: decisionTimes.length > 0 ? Math.round(decisionTimes.reduce((sum, days) => sum + days, 0) / decisionTimes.length) : 0,
      totalApplications: data.length,
      pendingApplications,
      fastestResponse: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      slowestResponse: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
    };
  };

  if (loading) {
    return (
      <Card className="apple-card border-0 shadow-lg h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
          <p className="text-gray-600">Loading process timeline analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="apple-card border-0 shadow-lg h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <Clock className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No process timeline data to display.</p>
          <p className="text-sm text-gray-500">Add applications with process dates to see timing analytics!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="apple-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Application Process Timeline</CardTitle>
        <p className="text-sm text-gray-600">Track response times, interview scheduling, and decision timelines.</p>
      </CardHeader>
      <CardContent>
        {/* Process Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.avgResponseTime} days</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="text-xs text-gray-500">
              {stats.fastestResponse > 0 && `${stats.fastestResponse}-${stats.slowestResponse} days range`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.avgInterviewTime} days</div>
            <div className="text-sm text-gray-600">Avg Interview Time</div>
            <div className="text-xs text-gray-500">Response to interview</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.avgDecisionTime} days</div>
            <div className="text-sm text-gray-600">Avg Decision Time</div>
            <div className="text-xs text-gray-500">Interview to decision</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApplications}</div>
            <div className="text-sm text-gray-600">Currently Pending</div>
            <div className="text-xs text-gray-500">Awaiting response</div>
          </div>
        </div>

        {/* Process Timeline Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="date" 
                className="text-gray-500"
                fontSize={12}
              />
              <YAxis className="text-gray-500" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === 'avgResponseTime') return [`${value} days`, 'Response Time'];
                  if (name === 'avgInterviewTime') return [`${value} days`, 'Interview Time'];
                  if (name === 'avgDecisionTime') return [`${value} days`, 'Decision Time'];
                  if (name === 'pendingApplications') return [`${value}`, 'Pending Applications'];
                  return [value, name];
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgResponseTime"
                stroke="#3b82f6" // blue-500
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Response Time (days)"
              />
              <Line
                type="monotone"
                dataKey="avgInterviewTime"
                stroke="#eab308" // yellow-600
                strokeWidth={2}
                dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }}
                name="Interview Time (days)"
              />
              <Line
                type="monotone"
                dataKey="avgDecisionTime"
                stroke="#10b981" // green-600
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Decision Time (days)"
              />
              <Line
                type="monotone"
                dataKey="pendingApplications"
                stroke="#f97316" // orange-500
                strokeWidth={2}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                name="Pending Applications"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Process Insights */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Process Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">
                  <strong>Fastest Response:</strong> {stats.fastestResponse} days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-gray-700">
                  <strong>Slowest Response:</strong> {stats.slowestResponse} days
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">
                  <strong>Total Applications:</strong> {stats.totalApplications}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-gray-700">
                  <strong>Pending:</strong> {stats.pendingApplications} applications
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}