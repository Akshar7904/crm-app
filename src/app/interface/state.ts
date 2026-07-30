// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// Enterprize360 HR & Payroll Management System
// Unauthorised copying, distribution or modification is strictly prohibited.

import { DataState } from "../enum/datastate.enum";

export interface State<T> {
    dataState: DataState;
    appData?: T;
    error?: string;
}