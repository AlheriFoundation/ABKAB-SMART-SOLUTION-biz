# ABKAB BizManager Security Specification & Invariants

## 1. Data Invariants
1. **Multi-Tenant Isolation**: A business record (`/businesses/{businessId}`) can only be accessed or modified by its owner (`resource.data.ownerId == request.auth.uid`) or authorized staff members (`exists(/businesses/{businessId}/members/$(request.auth.uid))`).
2. **Subcollection Inheritance**: Subcollections (`products`, `sales`, `expenses`, `customers`, `suppliers`, `invoices`, `staff`) can only be read or written if the requesting user is an active member or owner of the parent business `/businesses/{businessId}`.
3. **Immutability of Critical Identity**: `businessId` and `ownerId` cannot be mutated on update.
4. **User Profiles Isolation**: A user can only read and write their own `/users/{userId}` document where `request.auth.uid == userId`.
5. **Super Admin Access**: Platform super admins stored in `/admins/{userId}` can view businesses for platform administration.
6. **Strict Input Bounds**: All text fields, IDs, and financial amounts have strict type and size constraints to prevent Denial of Wallet or injection.

## 2. The Dirty Dozen Payloads (Targeting Vulnerabilities)
1. **Payload 1 (Tenant Hijack)**: User B attempts to read `/businesses/bizA/sales/sale1`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Orphaned Write)**: User writes to `/businesses/biz_fake/products/prod1` where parent business doesn't exist or user is not a member. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Owner Id Alteration)**: User updates `/businesses/biz1` attempting to change `ownerId` to someone else. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Profile Impersonation)**: Authenticated User A attempts to write to `/users/userB`. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Unauthenticated Scrape)**: Unauthenticated request queries `/businesses`. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Oversized Payload / Wallet Attack)**: A sale document with 100kb payload or 2000-character description. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Negative Price Injection)**: Creating a product with `sellingPrice: -5000`. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Invalid ID Injection)**: Document path variable with malicious symbols `/businesses/../../../etc/passwd`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Role Escalation)**: Regular user writes themselves to `/admins/{userId}`. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Direct Cross-Business Invoice Reading)**: An unauthorized caller attempts to list invoices of an unrelated business. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Shadow Key Injection)**: Creating a business with extra undeclared privilege fields `isSuperAdmin: true`. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Blanket Member Read Leak)**: A non-member attempting to list all staff members of another business. Expected: `PERMISSION_DENIED`.
