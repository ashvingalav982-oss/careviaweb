# CAREVIA Platform: Comprehensive Administrative & Operational Guide

## 1. Introduction
CAREVIA is an elite concierge healthcare and domestic management platform designed for high-net-worth individuals and premium service providers. This document outlines the technical and operational protocols for administrators.

## 2. Access & Authentication
### 2.1 User Roles
- **Customer**: Standard access for booking services.
- **Service Provider**: Access to dashboard for managing assigned tasks.
- **Admin**: Full oversight of platform operations, financial data, and security protocols.

### 2.2 Global Login
- All users log in via **Google Authentication** or **Phone OTP Verification**.
- **Admin Access**: Specifically reserved for authorized phone numbers (Master Admin: `6377446920`). 
- **Admin Two-Step Verification**: Login -> Admin Console -> Secondary Credential/OTP Check.

## 3. Data Infrastructure
### 3.1 Storage (Firebase Firestore)
All data is stored in **Google Cloud Firestore**.
- `users`: Profile and role data.
- `bookings`: Transactional records of all service requests.
- `queries`: Support logs and SOS critical alerts.
- `transactions`: Financial audit trails.

### 3.2 Accessing Data
Data can be accessed via:
1. **Admin Dashboard**: Real-time operational view.
2. **Firebase Console**: Direct database management (Restricted to technical leads).
3. **Data Export**: CSV/PDF exports available in the "Data & Intelligence" tab of the Admin Dashboard.

## 4. Security Protocols
### 4.1 Master Admin Control
The Admin Dashboard features a **Master OTP Generator**.
- **Utility**: Overrides individual booking OTPs in cases of field emergencies or provider lockouts.
- **Validity**: 5-minute rotation for maximum security.
- **Access**: Only visible to verified Admins.

### 4.2 SOS Alert Integration
- Users have an **SOS Button** available at all times.
- **Care Police / Air Ambulance**: Triggering these alerts logs a **CRITICAL** status event in the `queries` collection.
- **Admin Notification**: Alerts appear instantly in the Admin Dashboard "Critical Access" feed with a pulsing red indicator.

### 4.3 Website Security
- **Firestore Rules**: Strict attribute-based access control (ABAC) prevents unauthorized data scraping.
- **SSL/TLS**: All transmissions are encrypted under modern web standards.
- **Session Management**: Automatic logout on credential change or manual sign-out clears all local caches.

## 5. Operations Management
### 5.1 Booking Workflow
1. **Request**: Customer makes a booking.
2. **Match**: Providers view and accept requests.
3. **Verification**: Provider arrives and enters the OTP provided by the Customer (or Master OTP from Admin).
4. **Completion**: Service ends via final OTP verification.

### 5.2 Financial Oversight
- **Revenue Monitoring**: Real-time tracking of total platform volume.
- **Bank Details**: Secure management of payouts to service partners.

## 6. Deployment Readiness
- **Database**: Connected and synced.
- **OTP AI**: Verified for pattern matching and expiry.
- **SOS Alerts**: Connectivity to Admin Console confirmed.
- **Clean State**: Mock data removed; system is ready for live traffic.

---
**Confidentiality Notice**: This document contains proprietary operational information. Unauthorized distribution is strictly prohibited. © 2025 CAREVIA™
