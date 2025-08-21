import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

interface ApplicationCount {
  date: string;
  count: number;
}

interface ApplicationCalendarProps {
  onDateSelect?: (date: Date, applications: any[]) => void;
}

export const ApplicationCalendar: React.FC<ApplicationCalendarProps> = ({
  onDateSelect,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [applicationCounts, setApplicationCounts] = useState<ApplicationCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateApplications, setSelectedDateApplications] = useState<any[]>([]);

  const fetchApplicationCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = startOfMonth(selectedDate || new Date());
      const endDate = endOfMonth(selectedDate || new Date());

      const { data, error } = await supabase
        .from('job_applications')
        .select('application_date, company_name, position_title')
        .eq('user_id', user.id)
        .gte('application_date', format(startDate, 'yyyy-MM-dd'))
        .lte('application_date', format(endDate, 'yyyy-MM-dd'))
        .order('application_date', { ascending: true });

      if (error) throw error;

      // Group by date and count
      const counts = data.reduce((acc: Record<string, any[]>, app) => {
        const date = app.application_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(app);
        return acc;
      }, {});

      const applicationCounts = Object.entries(counts).map(([date, apps]) => ({
        date,
        count: apps.length,
      }));

      setApplicationCounts(applicationCounts);

      // Set applications for selected date
      if (selectedDate) {
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        const appsForDate = counts[selectedDateStr] || [];
        setSelectedDateApplications(appsForDate);
        onDateSelect?.(selectedDate, appsForDate);
      }
    } catch (error) {
      console.error('Error fetching application counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationCounts();
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const appsForDate = applicationCounts
        .filter(count => count.date === dateStr)
        .flatMap(() => selectedDateApplications);
      onDateSelect?.(date, appsForDate);
    }
  };

  const getApplicationCount = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = applicationCounts.find(app => app.date === dateStr);
    return count ? count.count : 0;
  };

  const getTotalApplications = () => {
    return applicationCounts.reduce((sum, count) => sum + count.count, 0);
  };

  const modifiers = {
    hasApplications: (date: Date) => getApplicationCount(date) > 0,
  };

  const modifiersStyles = {
    hasApplications: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '6px',
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading calendar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Application Calendar
          <Badge variant="secondary">
            {getTotalApplications()} this month
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border w-full"
          />
          
          {selectedDate && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {format(selectedDate, 'MMMM d, yyyy')}
              </h4>
              <div className="text-sm text-muted-foreground">
                {getApplicationCount(selectedDate)} application(s) on this day
              </div>
              {selectedDateApplications.length > 0 && (
                <div className="space-y-1">
                  {selectedDateApplications.map((app, index) => (
                    <div key={index} className="text-xs p-2 bg-muted rounded">
                      <span className="font-medium">{app.company_name}</span> - {app.position_title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};