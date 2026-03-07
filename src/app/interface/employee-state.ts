import { Employee } from '../component/employee/employee.model';
import { UserModel } from '../component/profile/user.model';

/**
 * Employee State - represents the state of a single employee view
 */
export interface EmployeeState {
  user: UserModel;
  employee: Employee;
}

/**
 * Employee Stats - for dashboard statistics
 */
export interface EmployeeStats {
  totalEmployees: number;
  activeEmployees?: number;
  onLeaveEmployees?: number;
  newHiresThisMonth?: number;
}

export { Employee };

