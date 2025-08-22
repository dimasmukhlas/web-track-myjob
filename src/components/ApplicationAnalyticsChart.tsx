import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from 'date-fns';

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
  const [selectedDate] = useState<Date>(new Date());

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);

      const { data, error } = await supabase
        .from('job_applications')
        .select('application_date, application_status, updated_at, created_at')
        .eq('user_id', user.id)
        .gte('application_date', format(startDate, 'yyyy-MM-dd'))
        .lte('application_date', format(endDate, 'yyyy-MM-dd'))
        .order('application_date', { ascending: true });

      if (error) throw error;

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
  }, [selectedDate]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Analytics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track your application trends and review times
        </p>
      </CardHeader>
      <CardContent>
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