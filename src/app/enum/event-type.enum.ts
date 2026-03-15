// Copyright (c) 2026 Zwelithini Ngomane (cypriel17@gmail.com). All rights reserved.
// LKCentrix HR & Payroll Management System — ORION
// Unauthorised copying, distribution or modification is strictly prohibited.

export enum EventType {
    LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
    LOGIN_ATTEMPT_FAILURE = 'LOGIN_ATTEMPT_FAILURE',
    LOGIN_ATTEMPT_SUCCESS = 'LOGIN_ATTEMPT_SUCCESS',
    PROFILE_UPDATE = 'PROFILE_UPDATE',
    PROFILE_PICTURE_UPDATE = 'PROFILE_PICTURE_UPDATE',
    ROLE_UPDATE = 'ROLE_UPDATE',
    ACCOUNT_SETTINGS_UPDATE = 'ACCOUNT_SETTINGS_UPDATE',
    PASSWORD_UPDATE = 'PASSWORD_UPDATE',
    MFA_UPDATE = 'MFA_UPDATE'
}