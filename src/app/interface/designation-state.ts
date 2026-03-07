import { Designation } from '../component/designation/designation.model';

/**
 * State interface for Designation module
 */
export interface DesignationState {
  designations: Designation[];
  designation: Designation | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
