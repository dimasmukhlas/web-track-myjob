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
import { Trash2, Building, MapPin, Calendar, DollarSign, FileText, Download, Edit } from 'lucide-react';
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
  cv_file_url?: string;
  cv_file_name?: string;
  cover_letter_url?: string;
  cover_letter_name?: string;
  created_at: string;
  updated_at: string;
}

export function JobApplicationsList() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const { toast } = useToast();
  
  const itemsPerPage = 10;

  const fetchApplications = async () => {
    try {
      const data = await db.getJobApplications();
      setApplications(data || []);
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

  // Pagination logic
  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = applications.slice(startIndex, startIndex + itemsPerPage);

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

      {applications.length === 0 ? (
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
      ) : (
        <div className="grid gap-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card className="apple-card border-0 shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    <TableHead className="font-semibold text-gray-700">Company & Position</TableHead>
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