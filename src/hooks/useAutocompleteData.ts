import { useState, useEffect } from 'react';
import { db } from '@/integrations/firebase/database';
import { ComboboxOption } from '@/components/ui/combobox';

const DEFAULT_COMPANIES = [
  'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Tesla', 'Uber', 
  'Airbnb', 'Spotify', 'LinkedIn', 'Twitter', 'Adobe', 'Salesforce', 'Oracle'
];

const DEFAULT_POSITIONS = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer', 
  'Mobile Developer', 'QA Engineer', 'Technical Lead', 'Engineering Manager'
];

const DEFAULT_APPLICATION_METHODS = [
  'Company Website', 'LinkedIn', 'Indeed', 'Glassdoor', 'AngelList', 'Referral',
  'Job Fair', 'Recruiter', 'Direct Email', 'GitHub Jobs', 'Stack Overflow Jobs'
];

export const useAutocompleteData = () => {
  const [companies, setCompanies] = useState<ComboboxOption[]>([]);
  const [positions, setPositions] = useState<ComboboxOption[]>([]);
  const [applicationMethods, setApplicationMethods] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAutocompleteData();
  }, []);

  const fetchAutocompleteData = async () => {
    try {
      // Fetch unique values from user's existing applications
      const data = await db.getAutocompleteData();

      // Extract unique companies
      const uniqueCompanies = Array.from(
        new Set([
          ...DEFAULT_COMPANIES,
          ...data.map(app => app.company_name).filter(Boolean)
        ])
      ).map(company => ({ value: company, label: company }));

      // Extract unique positions
      const uniquePositions = Array.from(
        new Set([
          ...DEFAULT_POSITIONS,
          ...data.map(app => app.position_title).filter(Boolean)
        ])
      ).map(position => ({ value: position, label: position }));

      // Extract unique application methods
      const uniqueMethods = Array.from(
        new Set([
          ...DEFAULT_APPLICATION_METHODS,
          ...data.map(app => app.application_method).filter(Boolean)
        ])
      ).map(method => ({ value: method, label: method }));

      setCompanies(uniqueCompanies);
      setPositions(uniquePositions);
      setApplicationMethods(uniqueMethods);
    } catch (error) {
      console.error('Error fetching autocomplete data:', error);
      setDefaultValues();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultValues = () => {
    setCompanies(DEFAULT_COMPANIES.map(company => ({ value: company, label: company })));
    setPositions(DEFAULT_POSITIONS.map(position => ({ value: position, label: position })));
    setApplicationMethods(DEFAULT_APPLICATION_METHODS.map(method => ({ value: method, label: method })));
    setLoading(false);
  };

  return {
    companies,
    positions,
    applicationMethods,
    loading,
    refetch: fetchAutocompleteData
  };
};