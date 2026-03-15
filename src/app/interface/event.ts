// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

import { EventType } from "../enum/event-type.enum";

export interface Events {
    id: number;
    type: EventType;
    description: string;
    device: string;
    ipAddress: string;
    createdAt: Date;
}
