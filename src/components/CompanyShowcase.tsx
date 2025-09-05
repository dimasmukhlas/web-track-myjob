import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/integrations/firebase/database';
import { Building2, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface CompanyData {
  name: string;
  applications: number;
  latestApplication: string;
  statuses: string[];
  areasOfWork: string[];
}

// Company emoji mapping
const getCompanyEmoji = (companyName: string): string => {
  const name = companyName.toLowerCase();
  
  // Tech companies
  if (name.includes('google')) return '🔍';
  if (name.includes('microsoft')) return '🪟';
  if (name.includes('apple')) return '🍎';
  if (name.includes('amazon')) return '📦';
  if (name.includes('meta') || name.includes('facebook')) return '📘';
  if (name.includes('netflix')) return '🎬';
  if (name.includes('tesla')) return '⚡';
  if (name.includes('uber')) return '🚗';
  if (name.includes('airbnb')) return '🏠';
  if (name.includes('spotify')) return '🎵';
  if (name.includes('linkedin')) return '💼';
  if (name.includes('twitter') || name.includes('x')) return '🐦';
  if (name.includes('adobe')) return '🎨';
  if (name.includes('salesforce')) return '☁️';
  if (name.includes('oracle')) return '🗄️';
  if (name.includes('ibm')) return '🔵';
  if (name.includes('intel')) return '💻';
  if (name.includes('nvidia')) return '🎮';
  if (name.includes('paypal')) return '💳';
  if (name.includes('stripe')) return '💸';
  if (name.includes('shopify')) return '🛒';
  if (name.includes('zoom')) return '📹';
  if (name.includes('slack')) return '💬';
  if (name.includes('dropbox')) return '📁';
  if (name.includes('github')) return '🐙';
  if (name.includes('docker')) return '🐳';
  if (name.includes('kubernetes')) return '⚓';
  if (name.includes('aws')) return '☁️';
  if (name.includes('azure')) return '🔷';
  if (name.includes('gcp') || name.includes('google cloud')) return '🌩️';
  
  // Finance companies
  if (name.includes('goldman') || name.includes('sachs')) return '🏦';
  if (name.includes('jpmorgan') || name.includes('jp morgan')) return '🏛️';
  if (name.includes('morgan stanley')) return '💼';
  if (name.includes('blackrock')) return '⚫';
  if (name.includes('visa')) return '💳';
  if (name.includes('mastercard')) return '💳';
  if (name.includes('american express') || name.includes('amex')) return '💳';
  if (name.includes('chase')) return '🏦';
  if (name.includes('wells fargo')) return '🏦';
  if (name.includes('bank of america')) return '🏦';
  
  // Consulting companies
  if (name.includes('mckinsey')) return '📊';
  if (name.includes('bain')) return '🎯';
  if (name.includes('bcg') || name.includes('boston consulting')) return '📈';
  if (name.includes('deloitte')) return '🔍';
  if (name.includes('pwc') || name.includes('pricewaterhouse')) return '📋';
  if (name.includes('kpmg')) return '📊';
  if (name.includes('ey') || name.includes('ernst & young')) return '👁️';
  if (name.includes('accenture')) return '🔧';
  
  // Healthcare companies
  if (name.includes('pfizer')) return '💊';
  if (name.includes('johnson & johnson') || name.includes('jnj')) return '🏥';
  if (name.includes('merck')) return '🧬';
  if (name.includes('novartis')) return '🔬';
  if (name.includes('roche')) return '🧪';
  if (name.includes('gsk') || name.includes('glaxosmithkline')) return '💉';
  
  // Automotive companies
  if (name.includes('ford')) return '🚗';
  if (name.includes('general motors') || name.includes('gm')) return '🚙';
  if (name.includes('toyota')) return '🚗';
  if (name.includes('honda')) return '🏍️';
  if (name.includes('bmw')) return '🚗';
  if (name.includes('mercedes')) return '🚗';
  if (name.includes('audi')) return '🚗';
  if (name.includes('volkswagen') || name.includes('vw')) return '🚗';
  
  // Retail companies
  if (name.includes('walmart')) return '🛒';
  if (name.includes('target')) return '🎯';
  if (name.includes('costco')) return '📦';
  if (name.includes('home depot')) return '🔨';
  if (name.includes('lowes')) return '🏠';
  if (name.includes('best buy')) return '📱';
  if (name.includes('nike')) return '👟';
  if (name.includes('adidas')) return '👟';
  if (name.includes('starbucks')) return '☕';
  if (name.includes('mcdonalds')) return '🍟';
  if (name.includes('coca cola') || name.includes('coca-cola')) return '🥤';
  if (name.includes('pepsi')) return '🥤';
  
  // Media companies
  if (name.includes('disney')) return '🏰';
  if (name.includes('warner') || name.includes('wb')) return '🎬';
  if (name.includes('sony')) return '🎮';
  if (name.includes('nintendo')) return '🎮';
  if (name.includes('ea') || name.includes('electronic arts')) return '🎮';
  if (name.includes('activision')) return '🎮';
  if (name.includes('blizzard')) return '❄️';
  if (name.includes('valve')) return '🔧';
  if (name.includes('epic games')) return '🎮';
  if (name.includes('riot games')) return '⚔️';
  
  // Default emojis based on company name patterns
  if (name.includes('tech') || name.includes('technology')) return '💻';
  if (name.includes('software')) return '💾';
  if (name.includes('data') || name.includes('analytics')) return '📊';
  if (name.includes('ai') || name.includes('artificial intelligence')) return '🤖';
  if (name.includes('fintech') || name.includes('financial')) return '💰';
  if (name.includes('health') || name.includes('medical')) return '🏥';
  if (name.includes('education') || name.includes('learning')) return '🎓';
  if (name.includes('energy') || name.includes('power')) return '⚡';
  if (name.includes('food') || name.includes('restaurant')) return '🍽️';
  if (name.includes('travel') || name.includes('tourism')) return '✈️';
  if (name.includes('real estate') || name.includes('property')) return '🏢';
  if (name.includes('insurance')) return '🛡️';
  if (name.includes('logistics') || name.includes('shipping')) return '📦';
  if (name.includes('manufacturing') || name.includes('production')) return '🏭';
  if (name.includes('consulting') || name.includes('advisory')) return '💼';
  if (name.includes('marketing') || name.includes('advertising')) return '📢';
  if (name.includes('design') || name.includes('creative')) return '🎨';
  if (name.includes('security') || name.includes('cyber')) return '🔒';
  if (name.includes('startup') || name.includes('venture')) return '🚀';
  if (name.includes('nonprofit') || name.includes('foundation')) return '❤️';
  
  // Default fallback
  return '🏢';
};

const getStatusEmoji = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'applied': return '📝';
    case 'interview': return '🎯';
    case 'offer': return '🎉';
    case 'rejected': return '❌';
    case 'withdrawn': return '↩️';
    default: return '⏳';
  }
};

export function CompanyShowcase() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const applications = await db.getJobApplications();
      
      if (!applications || applications.length === 0) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      // Group applications by company
      const companyMap = new Map<string, CompanyData>();
      
      applications.forEach(app => {
        const companyName = app.company_name;
        
        if (!companyMap.has(companyName)) {
          companyMap.set(companyName, {
            name: companyName,
            applications: 0,
            latestApplication: app.application_date,
            statuses: [],
            areasOfWork: []
          });
        }
        
        const company = companyMap.get(companyName)!;
        company.applications++;
        
        // Update latest application date
        if (new Date(app.application_date) > new Date(company.latestApplication)) {
          company.latestApplication = app.application_date;
        }
        
        // Add unique statuses
        if (!company.statuses.includes(app.application_status)) {
          company.statuses.push(app.application_status);
        }
        
        // Add unique areas of work
        if (app.area_of_work && !company.areasOfWork.includes(app.area_of_work)) {
          company.areasOfWork.push(app.area_of_work);
        }
      });

      // Convert to array and sort by application count (descending)
      const companyArray = Array.from(companyMap.values())
        .sort((a, b) => b.applications - a.applications);

      setCompanies(companyArray);
      setTotalApplications(applications.length);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="apple-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold apple-heading text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Company Showcase
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-gray-600 font-medium">Loading companies...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card className="apple-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold apple-heading text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Company Showcase
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies yet</h3>
          <p className="text-gray-600 text-center text-sm">
            Start applying to companies to see them appear here with their emojis!
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
            <Building2 className="h-5 w-5 text-indigo-600" />
            Company Showcase
          </CardTitle>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-200">
            {companies.length} companies • {totalApplications} applications
          </Badge>
        </div>
        <p className="text-gray-600 text-sm">
          All the companies you've applied to, organized by application count
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company, index) => (
            <div
              key={company.name}
              className="group relative p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              {/* Company Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{getCompanyEmoji(company.name)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                    {company.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Latest: {format(new Date(company.latestApplication), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Application Count */}
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">
                  {company.applications} application{company.applications !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1 mb-3">
                {company.statuses.map(status => (
                  <Badge
                    key={status}
                    variant="outline"
                    className="text-xs px-2 py-1 bg-white border-gray-200"
                  >
                    {getStatusEmoji(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                ))}
              </div>

              {/* Areas of Work */}
              {company.areasOfWork.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">Areas of Work:</div>
                  <div className="flex flex-wrap gap-1">
                    {company.areasOfWork.slice(0, 2).map(area => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 border-indigo-200"
                      >
                        {area}
                      </Badge>
                    ))}
                    {company.areasOfWork.length > 2 && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-2 py-1 bg-gray-50 text-gray-600 border-gray-200"
                      >
                        +{company.areasOfWork.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Ranking Badge */}
              <div className="absolute top-2 right-2">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 bg-white border-gray-200 text-gray-600"
                >
                  #{index + 1}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{companies.length}</div>
              <div className="text-xs text-gray-600">Companies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalApplications}</div>
              <div className="text-xs text-gray-600">Total Applications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {companies.filter(c => c.statuses.includes('interview')).length}
              </div>
              <div className="text-xs text-gray-600">With Interviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {companies.filter(c => c.statuses.includes('offer')).length}
              </div>
              <div className="text-xs text-gray-600">With Offers</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
