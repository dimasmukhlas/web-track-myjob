import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/integrations/firebase/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, min, max } from 'date-fns';

interface ChartData {
  date: string;
  applications: number;
  rejections: number;
  interviews: number;
  offers: number;
  responses: number;
  pending: number;
}

interface ApplicationData {
  application_date: string;
  application_status: string;
  updated_at: string;
  application_sent_date?: string;
  first_response_date?: string;
  interview_scheduled_date?: string;
  interview_completed_date?: string;
  offer_received_date?: string;
  rejection_date?: string;
  withdrawal_date?: string;
}

export const ApplicationAnalyticsChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      // First, get all applications to determine the date range
      const allApplications = await db.getJobApplications();
      
      if (allApplications.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      // Find the earliest and latest application dates
      const applicationDates = allApplications.map(app => parseISO(app.application_date));
      const earliestDate = min(applicationDates);
      const latestDate = max(applicationDates);
      
      // Set the date range from first application to now (or latest application)
      const startDate = earliestDate;
      const endDate = latestDate > new Date() ? latestDate : new Date();
      
      setDateRange({ start: startDate, end: endDate });

      const data = await db.getJobApplicationsForAnalytics(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );

      // Generate all days in the month
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      
      const chartData: ChartData[] = allDays.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayApplications = data.filter(app => app.application_date === dayStr);
        
        // Count applications for this day
        const applicationsCount = dayApplications.length;
        
        // Count different statuses for this day
        const rejectionsCount = dayApplications.filter(app => app.application_status === 'rejected').length;
        const interviewsCount = dayApplications.filter(app => app.application_status === 'interview').length;
        const offersCount = dayApplications.filter(app => app.application_status === 'offer').length;
        
        // Count responses (applications that got first response on this day)
        const responsesCount = dayApplications.filter(app => 
          app.first_response_date === dayStr
        ).length;
        
        // Count pending applications (applied but no response yet)
        const pendingCount = data.filter(app => 
          parseISO(app.application_date) <= day && 
          app.application_status === 'applied' &&
          !app.first_response_date &&
          !app.rejection_date && 
          !app.offer_received_date && 
          !app.withdrawal_date
        ).length;

        return {
          date: format(day, 'MMM dd'),
          applications: applicationsCount,
          rejections: rejectionsCount,
          interviews: interviewsCount,
          offers: offersCount,
          responses: responsesCount,
          pending: pendingCount,
        };
      });

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics
  const totalApplications = chartData.reduce((sum, day) => sum + day.applications, 0);
  const totalRejections = chartData.reduce((sum, day) => sum + day.rejections, 0);
  const totalInterviews = chartData.reduce((sum, day) => sum + day.interviews, 0);
  const totalOffers = chartData.reduce((sum, day) => sum + day.offers, 0);
  const totalResponses = chartData.reduce((sum, day) => sum + day.responses, 0);
  const currentPending = chartData.length > 0 ? chartData[chartData.length - 1].pending : 0;
  const daysSinceFirstApplication = dateRange ? differenceInDays(new Date(), dateRange.start) : 0;
  const applicationsPerWeek = daysSinceFirstApplication > 0 ? (totalApplications / (daysSinceFirstApplication / 7)).toFixed(1) : '0';
  const responseRate = totalApplications > 0 ? ((totalResponses / totalApplications) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Application Journey</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your application activity from {dateRange ? format(dateRange.start, 'MMM dd, yyyy') : 'start'} to now
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalApplications}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
            <div className="text-xs text-gray-500">{applicationsPerWeek}/week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalResponses}</div>
            <div className="text-sm text-gray-600">Responses</div>
            <div className="text-xs text-gray-500">{responseRate}% rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{totalInterviews}</div>
            <div className="text-sm text-gray-600">Interviews</div>
            <div className="text-xs text-gray-500">{totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(1) : '0'}% rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalOffers}</div>
            <div className="text-sm text-gray-600">Offers</div>
            <div className="text-xs text-gray-500">{totalApplications > 0 ? ((totalOffers / totalApplications) * 100).toFixed(1) : '0'}% rate</div>
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalRejections}</div>
            <div className="text-sm text-gray-600">Rejections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{currentPending}</div>
            <div className="text-sm text-gray-600">Currently Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{daysSinceFirstApplication}</div>
            <div className="text-sm text-gray-600">Days Active</div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis className="text-muted-foreground" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#3b82f6" // blue-500
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Applications Sent"
              />
              <Line
                type="monotone"
                dataKey="responses"
                stroke="#10b981" // green-600
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Responses Received"
              />
              <Line
                type="monotone"
                dataKey="interviews"
                stroke="#eab308" // yellow-600
                strokeWidth={2}
                dot={{ fill: '#eab308', strokeWidth: 2, r: 4 }}
                name="Interviews"
              />
              <Line
                type="monotone"
                dataKey="offers"
                stroke="#8b5cf6" // purple-500
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                name="Offers"
              />
              <Line
                type="monotone"
                dataKey="rejections"
                stroke="#ef4444" // red-500
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name="Rejections"
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#f97316" // orange-500
                strokeWidth={2}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                name="Pending Applications"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};