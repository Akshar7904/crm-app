import { Department } from '../component/department/department.model';

/**
 * Department state interface for reactive state management
 */
export interface DepartmentState {
  departments: Department[];
  department: Department | null;
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
