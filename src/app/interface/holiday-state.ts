// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { DataState } from '../enum/datastate.enum';
import { Holiday, HolidayResponse, HolidayStats } from '../component/holiday/holiday.model';

/**
 * Holiday State Interface
 * State management for holiday module with RxJS
 * 
 * @author DeCode
 * @version 1.0
 * @since 2025-01-10
 */

export interface HolidayState {
  dataState: DataState;
  appData?: {
    holidays?: Holiday[];
    page?: number;
    size?: number;
    totalHolidays?: number;
    totalPages?: number;
    stats?: HolidayStats;
  };
  holiday?: Holiday;
  error?: string;
  isLoading?: boolean;
}

export interface CustomHttpResponse<T> {
  timeStamp: string;
  statusCode: number;
  status: string;
  message: string;
  data: T;
}
