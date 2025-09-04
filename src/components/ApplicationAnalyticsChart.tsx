import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/integrations/firebase/database';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, min, max } from 'date-fns';

interface ChartData {
  date: string;
  applications: number;
  rejections: number;
  avgReviewTime: number;
}

interface ApplicationData {
  application_date: string;
  application_status: string;
  updated_at: string;
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
        
        // Count rejections for this day
        const rejectionsCount = dayApplications.filter(app => app.application_status === 'rejected').length;
        
        // Calculate average review time for applications on this day
        const reviewTimes = dayApplications
          .filter(app => app.application_status !== 'applied') // Exclude still pending applications
          .map(app => {
            const appDate = parseISO(app.application_date);
            const updateDate = parseISO(app.updated_at);
            return differenceInDays(updateDate, appDate);
          })
          .filter(days => days >= 0); // Only positive values
        
        const avgReviewTime = reviewTimes.length > 0 
          ? Math.round(reviewTimes.reduce((sum, days) => sum + days, 0) / reviewTimes.length)
          : 0;

        return {
          date: format(day, 'MMM dd'),
          applications: applicationsCount,
          rejections: rejectionsCount,
          avgReviewTime,
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
  const daysSinceFirstApplication = dateRange ? differenceInDays(new Date(), dateRange.start) : 0;
  const applicationsPerWeek = daysSinceFirstApplication > 0 ? (totalApplications / (daysSinceFirstApplication / 7)).toFixed(1) : '0';

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
            <div className="text-2xl font-bold text-primary">{totalApplications}</div>
            <div className="text-sm text-muted-foreground">Total Applications</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{totalRejections}</div>
            <div className="text-sm text-muted-foreground">Rejections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalApplications - totalRejections}</div>
            <div className="text-sm text-muted-foreground">Still Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{applicationsPerWeek}</div>
            <div className="text-sm text-muted-foreground">Per Week</div>
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
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Applications Sent"
              />
              <Line
                type="monotone"
                dataKey="rejections"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                name="Rejections"
              />
              <Line
                type="monotone"
                dataKey="avgReviewTime"
                stroke="hsl(var(--secondary-foreground))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--secondary-foreground))', strokeWidth: 2, r: 4 }}
                name="Avg Review Time (days)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};