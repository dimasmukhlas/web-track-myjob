import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/integrations/firebase/database';
import { useToast } from '@/hooks/use-toast';
import { JobApplicationForm } from './JobApplicationForm';
import { ApplicationCalendar } from './ApplicationCalendar';
import { ApplicationAnalyticsChart } from './ApplicationAnalyticsChart';
import { format } from 'date-fns';
import { Trash2, Building, MapPin, Calendar, DollarSign, FileText, Download, Edit, Search, X, ChevronDown, ChevronRight, Archive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface JobApplication {
  id: string;
  company_name: string;
  position_title: string;
  area_of_work?: string;
  job_description?: string;
  application_date: string;
  application_status: string;
  job_location?: string;
  job_link?: string;
  salary_range?: string;
  job_type?: string;
  work_arrangement?: string;
  application_method?: string;
  contact_person?: string;
  contact_email?: string;
  notes?: string;
  follow_up_date?: string;
  // Process dates
  application_sent_date?: string;
  first_response_date?: string;
  interview_scheduled_date?: string;
  interview_completed_date?: string;
  offer_received_date?: string;
  offer_deadline_date?: string;
  rejection_date?: string;
  withdrawal_date?: string;
  cv_file_url?: string;
  cv_file_name?: string;
  cover_letter_url?: string;
  cover_letter_name?: string;
  created_at: string;
  updated_at: string;
}

export function JobApplicationsList() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [filteredRejectedApplications, setFilteredRejectedApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentRejectedPage, setCurrentRejectedPage] = useState(1);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejected, setShowRejected] = useState(false);
  const { toast } = useToast();
  
  const itemsPerPage = 10;

  const fetchApplications = async () => {
    try {
      const data = await db.getJobApplications();
      setApplications(data || []);
      setFilteredApplications(data || []);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch job applications.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  // Filter applications based on search query and separate active/rejected
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Separate active and rejected applications
      const activeApps = applications.filter(app => app.application_status !== 'rejected');
      const rejectedApps = applications.filter(app => app.application_status === 'rejected');
      
      setFilteredApplications(activeApps);
      setFilteredRejectedApplications(rejectedApps);
      setCurrentPage(1);
      setCurrentRejectedPage(1);
      return;
    }

    const filtered = applications.filter(app => 
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.position_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.area_of_work && app.area_of_work.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.job_location && app.job_location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.application_method && app.application_method.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Separate filtered results into active and rejected
    const activeFiltered = filtered.filter(app => app.application_status !== 'rejected');
    const rejectedFiltered = filtered.filter(app => app.application_status === 'rejected');
    
    setFilteredApplications(activeFiltered);
    setFilteredRejectedApplications(rejectedFiltered);
    setCurrentPage(1);
    setCurrentRejectedPage(1);
  }, [searchQuery, applications]);

  const deleteApplication = async (id: string) => {
    try {
      await db.deleteJobApplication(id);
      toast({
        title: 'Success',
        description: 'Application deleted successfully.',
      });
      fetchApplications();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete application.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Pagination logic for active applications
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

  // Pagination logic for rejected applications
  const totalRejectedPages = Math.ceil(filteredRejectedApplications.length / itemsPerPage);
  const startRejectedIndex = (currentRejectedPage - 1) * itemsPerPage;
  const paginatedRejectedApplications = filteredRejectedApplications.slice(startRejectedIndex, startRejectedIndex + itemsPerPage);

  const handleEditClick = (application: JobApplication) => {
    setEditingApplication(application);
  };

  const handleEditSuccess = () => {
    setEditingApplication(null);
    fetchApplications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'interview':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'offer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getProcessDates = (app: JobApplication) => {
    const dates = [];
    if (app.application_sent_date) dates.push({ label: 'Sent', date: app.application_sent_date, icon: '📤' });
    if (app.first_response_date) dates.push({ label: 'Response', date: app.first_response_date, icon: '📨' });
    if (app.interview_scheduled_date) dates.push({ label: 'Interview Scheduled', date: app.interview_scheduled_date, icon: '📅' });
    if (app.interview_completed_date) dates.push({ label: 'Interview Done', date: app.interview_completed_date, icon: '✅' });
    if (app.offer_received_date) dates.push({ label: 'Offer Received', date: app.offer_received_date, icon: '🎉' });
    if (app.rejection_date) dates.push({ label: 'Rejected', date: app.rejection_date, icon: '❌' });
    if (app.withdrawal_date) dates.push({ label: 'Withdrawn', date: app.withdrawal_date, icon: '↩️' });
    return dates;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-gray-600 font-medium">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold apple-heading text-gray-900">Job Applications</h2>
          <p className="text-gray-600 apple-text">Track and manage your job search journey</p>
        </div>
        <div className="flex gap-3">
          <JobApplicationForm onSuccess={fetchApplications} />
          {editingApplication && (
            <JobApplicationForm 
              onSuccess={handleEditSuccess} 
              editingApplication={editingApplication}
              onCancel={() => setEditingApplication(null)}
            />
          )}
        </div>
      </div>

      {/* Search Bar */}
      {applications.length > 0 && (
        <Card className="apple-card border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search applications by company, position, area of work, location, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                Found {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {filteredApplications.length === 0 && !searchQuery ? (
        <Card className="apple-card border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6">
              <Building className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold apple-heading text-gray-900 mb-3">No applications yet</h3>
            <p className="text-gray-600 apple-text text-center mb-8 max-w-md">
              Start your job search journey by adding your first application. Track your progress and stay organized.
            </p>
            <JobApplicationForm onSuccess={fetchApplications} />
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 && searchQuery ? (
        <Card className="apple-card border-0 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold apple-heading text-gray-900 mb-3">No results found</h3>
            <p className="text-gray-600 apple-text text-center mb-8 max-w-md">
              No applications match your search for "{searchQuery}". Try adjusting your search terms.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="apple-button border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium h-11 px-6 rounded-xl"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card className="apple-card border-0 shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="font-semibold text-gray-700">Company & Position</TableHead>
                    <TableHead className="font-semibold text-gray-700">Area of Work</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date Applied</TableHead>
                    <TableHead className="font-semibold text-gray-700">Location</TableHead>
                    <TableHead className="font-semibold text-gray-700">Job Link</TableHead>
                    <TableHead className="font-semibold text-gray-700">Files</TableHead>
                    <TableHead className="font-semibold text-gray-700">Salary</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedApplications.map((app) => (
                    <TableRow 
                      key={app.id} 
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-50"
                      onClick={() => handleEditClick(app)}
                    >
                      <TableCell>
                        <div>
                          <div className="font-semibold">{app.company_name}</div>
                          <div className="text-sm text-muted-foreground">{app.position_title}</div>
                          {app.job_type && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {app.job_type}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.area_of_work ? (
                          <Badge variant="secondary" className="text-xs">
                            {app.area_of_work}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(app.application_status)}>
                          {app.application_status.charAt(0).toUpperCase() + app.application_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(app.application_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          {app.job_location && (
                            <>
                              <MapPin className="h-3 w-3 mr-1" />
                              {app.job_location}
                            </>
                          )}
                        </div>
                        {app.work_arrangement && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {app.work_arrangement}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.job_link ? (
                          <a 
                            href={app.job_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Job
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {app.cv_file_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(app.cv_file_url, '_blank')}
                              title={app.cv_file_name || 'CV'}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          )}
                          {app.cover_letter_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(app.cover_letter_url, '_blank')}
                              title={app.cover_letter_name || 'Cover Letter'}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.salary_range && (
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {app.salary_range}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(app);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteApplication(app.id);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedApplications.map((app) => (
              <Card 
                key={app.id} 
                className="apple-card cursor-pointer hover:shadow-lg transition-all duration-300 border-0"
                onClick={() => handleEditClick(app)}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-bold text-gray-900">{app.company_name}</CardTitle>
                      <p className="text-gray-600 font-medium">{app.position_title}</p>
                      {app.area_of_work && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border-blue-200">
                          {app.area_of_work}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(app.application_status)} font-medium px-3 py-1 rounded-full`}>
                      {app.application_status.charAt(0).toUpperCase() + app.application_status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-3 text-blue-500" />
                    Applied on {format(new Date(app.application_date), 'MMM dd, yyyy')}
                  </div>
                  
                  {app.job_location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 text-green-500" />
                      {app.job_location}
                    </div>
                  )}
                  
                  {app.salary_range && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-3 text-emerald-500" />
                      {app.salary_range}
                    </div>
                  )}

                  {(app.cv_file_url || app.cover_letter_url) && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-1 text-purple-500" />
                      <div className="flex gap-2">
                        {app.cv_file_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(app.cv_file_url, '_blank')}
                            className="text-xs px-3 py-1 h-auto bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full"
                          >
                            CV
                          </Button>
                        )}
                        {app.cover_letter_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(app.cover_letter_url, '_blank')}
                            className="text-xs px-3 py-1 h-auto bg-green-50 text-green-600 hover:bg-green-100 rounded-full"
                          >
                            Cover Letter
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Process Timeline */}
                  {getProcessDates(app).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-600">Process Timeline:</div>
                      <div className="flex flex-wrap gap-2">
                        {getProcessDates(app).map((processDate, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-200"
                          >
                            <span>{processDate.icon}</span>
                            <span className="font-medium">{processDate.label}:</span>
                            <span>{format(new Date(processDate.date), 'MMM dd')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      {app.job_type && (
                        <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50 text-gray-600 border-gray-200">
                          {app.job_type}
                        </Badge>
                      )}
                      {app.work_arrangement && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600">
                          {app.work_arrangement}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(app);
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteApplication(app.id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {applications.length > itemsPerPage && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Rejected Applications Section */}
      {filteredRejectedApplications.length > 0 && (
        <div className="mt-8">
          <Collapsible open={showRejected} onOpenChange={setShowRejected}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between h-12 border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-700 font-medium"
              >
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Rejected Applications ({filteredRejectedApplications.length})
                </div>
                {showRejected ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 mb-4">
                  These applications have been rejected. They're kept here for reference and analytics purposes.
                </p>
                
                <div className="grid gap-6">
                  {/* Desktop Table View for Rejected */}
                  <div className="hidden lg:block">
                    <Card className="apple-card border-0 shadow-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-100">
                            <TableHead className="font-semibold text-gray-700">Company & Position</TableHead>
                            <TableHead className="font-semibold text-gray-700">Area of Work</TableHead>
                            <TableHead className="font-semibold text-gray-700">Date Applied</TableHead>
                            <TableHead className="font-semibold text-gray-700">Rejection Date</TableHead>
                            <TableHead className="font-semibold text-gray-700">Location</TableHead>
                            <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedRejectedApplications.map((app) => (
                            <TableRow 
                              key={app.id} 
                              className="cursor-pointer hover:bg-red-50/50 transition-colors duration-200 border-b border-gray-50 opacity-75"
                              onClick={() => handleEditClick(app)}
                            >
                              <TableCell>
                                <div>
                                  <div className="font-semibold">{app.company_name}</div>
                                  <div className="text-sm text-muted-foreground">{app.position_title}</div>
                                  {app.job_type && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {app.job_type}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {app.area_of_work ? (
                                  <Badge variant="secondary" className="text-xs">
                                    {app.area_of_work}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {format(new Date(app.application_date), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>
                                {app.rejection_date ? (
                                  format(new Date(app.rejection_date), 'MMM dd, yyyy')
                                ) : (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center text-sm">
                                  {app.job_location && (
                                    <>
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {app.job_location}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(app);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteApplication(app.id);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>

                  {/* Mobile Card View for Rejected */}
                  <div className="lg:hidden space-y-4">
                    {paginatedRejectedApplications.map((app) => (
                      <Card 
                        key={app.id} 
                        className="apple-card cursor-pointer hover:shadow-lg transition-all duration-300 border-0 opacity-75"
                        onClick={() => handleEditClick(app)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <CardTitle className="text-xl font-bold text-gray-900">{app.company_name}</CardTitle>
                              <p className="text-gray-600 font-medium">{app.position_title}</p>
                              {app.area_of_work && (
                                <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-50 text-blue-600 border-blue-200">
                                  {app.area_of_work}
                                </Badge>
                              )}
                            </div>
                            <Badge className="bg-red-100 text-red-800 font-medium px-3 py-1 rounded-full">
                              Rejected
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-3 text-blue-500" />
                            Applied on {format(new Date(app.application_date), 'MMM dd, yyyy')}
                          </div>
                          
                          {app.rejection_date && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-3 text-red-500" />
                              Rejected on {format(new Date(app.rejection_date), 'MMM dd, yyyy')}
                            </div>
                          )}
                          
                          {app.job_location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-3 text-green-500" />
                              {app.job_location}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="flex gap-2">
                              {app.job_type && (
                                <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50 text-gray-600 border-gray-200">
                                  {app.job_type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(app);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteApplication(app.id);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Pagination for Rejected Applications */}
                {totalRejectedPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentRejectedPage(prev => Math.max(1, prev - 1))}
                            className={currentRejectedPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalRejectedPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentRejectedPage(page)}
                              isActive={currentRejectedPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentRejectedPage(prev => Math.min(prev + 1, totalRejectedPages))}
                            className={currentRejectedPage === totalRejectedPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
      
      {/* Analytics Section */}
      {applications.length > 0 && (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="apple-fade-in">
            <ApplicationCalendar />
          </div>
          <div className="apple-fade-in" style={{ animationDelay: '0.2s' }}>
            <ApplicationAnalyticsChart />
          </div>
        </div>
      )}
    </div>
  );
}