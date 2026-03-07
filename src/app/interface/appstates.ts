import { DataState } from "../enum/datastate.enum";
import { CustomerModel } from "../component/customer/customer.model";
import { Employee } from "../component/employee/employee.model";
import { Events } from "./event";
import { Role } from "./role";
import { UserModel } from "../component/profile/user.model";

export interface LoginState {
  dataState: DataState;
  loginSuccess?: boolean;
  error?: string;
  message?: string;
  isUsingMfa?: boolean;
  phone?: string;
}

export interface CustomHttpResponse<T> {
  timestamp: Date;
  statusCode: number;
  status: string;
  message: string;
  reason?: string;
  developerMessage?: string;
  data?: T;
}

export interface Profile {
  user: UserModel;
  events?: Events[];
  roles?: Role[];
  access_token?: string;
  refresh_token?: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
}

export interface CustomerState {
  user: UserModel;
  customer: CustomerModel;
}

export interface EmployeeState {
  user: UserModel;
  employee: Employee;
}

export interface RegisterState {
  dataState: DataState;
  registerSuccess?: boolean;
  error?: string;
  message?: string;
}

export type AccountType = 'account' | 'password';

export interface VerifySate {
  dataState: DataState;
  verifySuccess?: boolean;
  error?: string;
  message?: string;
  title?: string;
  type?: AccountType;
}
