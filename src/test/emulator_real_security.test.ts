/**
 * ABKAB BizManager - Real Firebase Firestore Emulator Security Test Suite
 * 
 * Executes REAL Firestore Security Rules evaluation under actual Firebase Emulator
 * environment against all 7 critical attack vectors.
 */

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface TestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message: string;
}

const emulatorTestResults: TestResult[] = [];

function recordResult(id: string, category: string, name: string, passed: boolean, message: string) {
  emulatorTestResults.push({
    id,
    category,
    name,
    passed,
    message: passed ? `PASS: ${message}` : `FAIL: ${message}`,
  });
}

async function runRealEmulatorTests() {
  console.log('\n=============================================================');
  console.log('   INITIALIZING REAL FIREBASE FIRESTORE EMULATOR TEST SUITE   ');
  console.log('=============================================================\n');

  const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

  let testEnv: RulesTestEnvironment;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'steady-etching-wbcxw',
      firestore: {
        rules: rulesContent,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  } catch (err: any) {
    console.error('Failed to initialize test environment with Firestore emulator:', err);
    process.exit(1);
  }

  // Clear previous data before testing
  await testEnv.clearFirestore();

  // Setup seed documents with admin bypass (withSecurityRulesDisabled)
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();

    // 1. Business A: Active business
    await setDoc(doc(adminDb, 'businesses/biz_a'), {
      id: 'biz_a',
      ownerId: 'user_owner_a',
      name: 'Al-Barakah Supermart Kano',
      plan: 'growth',
      planStatus: 'active',
      currency: '₦',
      createdAt: new Date().toISOString(),
    });
    // Members for Business A
    await setDoc(doc(adminDb, 'businesses/biz_a/members/user_owner_a'), {
      role: 'owner',
      userId: 'user_owner_a',
    });
    await setDoc(doc(adminDb, 'businesses/biz_a/members/user_cashier_a'), {
      role: 'cashier',
      userId: 'user_cashier_a',
    });
    await setDoc(doc(adminDb, 'businesses/biz_a/members/user_clerk_a'), {
      role: 'inventory_clerk',
      userId: 'user_clerk_a',
    });
    // Product in Business A
    await setDoc(doc(adminDb, 'businesses/biz_a/products/prod_rice'), {
      id: 'prod_rice',
      businessId: 'biz_a',
      name: 'Mama Gold Rice (50kg)',
      costPrice: 65000,
      sellingPrice: 74000,
      quantity: 50,
      lowStockThreshold: 10,
      unit: 'Bags',
      updatedAt: new Date().toISOString(),
    });

    // 2. Business B: Expired subscription business
    await setDoc(doc(adminDb, 'businesses/biz_b'), {
      id: 'biz_b',
      ownerId: 'user_owner_b',
      name: 'Okafor Provisions Lagos',
      plan: 'starter',
      planStatus: 'expired',
      currency: '₦',
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(adminDb, 'businesses/biz_b/members/user_owner_b'), {
      role: 'owner',
      userId: 'user_owner_b',
    });

    // 3. Super Admin record in /admins
    await setDoc(doc(adminDb, 'admins/user_super_admin'), {
      email: 'abdulwasiukura@gmail.com',
      role: 'super_admin',
    });
  });

  // Client contexts
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const ownerADb = testEnv.authenticatedContext('user_owner_a', { email: 'owner_a@biz.ng', email_verified: true }).firestore();
  const ownerBDb = testEnv.authenticatedContext('user_owner_b', { email: 'owner_b@biz.ng', email_verified: true }).firestore();
  const cashierADb = testEnv.authenticatedContext('user_cashier_a', { email: 'cashier_a@biz.ng', email_verified: true }).firestore();
  const clerkADb = testEnv.authenticatedContext('user_clerk_a', { email: 'clerk_a@biz.ng', email_verified: true }).firestore();
  const spoofedAdminDb = testEnv.authenticatedContext('user_attacker', { email: 'abdulwasiukura@gmail.com', email_verified: false }).firestore();
  const superAdminDb = testEnv.authenticatedContext('user_super_admin', { email: 'abdulwasiukura@gmail.com', email_verified: true }).firestore();

  // ==========================================
  // TEST GROUP 1: UNAUTHENTICATED ACCESS
  // ==========================================
  console.log('Executing Test Group 1: Unauthenticated Access...');
  try {
    await assertFails(getDoc(doc(unauthDb, 'businesses/biz_a')));
    recordResult('EMU-AUTH-01', 'Unauthenticated', 'Deny unauthenticated business read', true, 'Unauthenticated read to /businesses/biz_a was rejected by rules');
  } catch (e: any) {
    recordResult('EMU-AUTH-01', 'Unauthenticated', 'Deny unauthenticated business read', false, e.message);
  }

  try {
    await assertFails(setDoc(doc(unauthDb, 'businesses/biz_hack'), { name: 'Hacked' }));
    recordResult('EMU-AUTH-02', 'Unauthenticated', 'Deny unauthenticated business create', true, 'Unauthenticated write to /businesses was rejected by rules');
  } catch (e: any) {
    recordResult('EMU-AUTH-02', 'Unauthenticated', 'Deny unauthenticated business create', false, e.message);
  }

  try {
    await assertFails(getDoc(doc(unauthDb, 'admins/user_super_admin')));
    recordResult('EMU-AUTH-03', 'Unauthenticated', 'Deny unauthenticated admin read', true, 'Unauthenticated read to /admins collection was rejected by rules');
  } catch (e: any) {
    recordResult('EMU-AUTH-03', 'Unauthenticated', 'Deny unauthenticated admin read', false, e.message);
  }

  // ==========================================
  // TEST GROUP 2: CROSS-BUSINESS DATA ISOLATION
  // ==========================================
  console.log('Executing Test Group 2: Cross-Business Data Isolation...');
  try {
    // Owner B attempts to read Business A details
    await assertFails(getDoc(doc(ownerBDb, 'businesses/biz_a')));
    recordResult('EMU-TENANT-01', 'Multi-Tenancy', 'Cross-business tenant read blocked', true, 'Owner B cannot read Business A');
  } catch (e: any) {
    recordResult('EMU-TENANT-01', 'Multi-Tenancy', 'Cross-business tenant read blocked', false, e.message);
  }

  try {
    // Owner B attempts to read Business A product
    await assertFails(getDoc(doc(ownerBDb, 'businesses/biz_a/products/prod_rice')));
    recordResult('EMU-TENANT-02', 'Multi-Tenancy', 'Cross-business product read blocked', true, 'Owner B cannot read Business A inventory');
  } catch (e: any) {
    recordResult('EMU-TENANT-02', 'Multi-Tenancy', 'Cross-business product read blocked', false, e.message);
  }

  try {
    // Owner B attempts to inject a product into Business A
    await assertFails(setDoc(doc(ownerBDb, 'businesses/biz_a/products/prod_hack'), {
      id: 'prod_hack',
      businessId: 'biz_a',
      name: 'Contraband Item',
      quantity: 10,
      costPrice: 100,
      sellingPrice: 200,
    }));
    recordResult('EMU-TENANT-03', 'Multi-Tenancy', 'Cross-business product injection blocked', true, 'Owner B cannot inject products into Business A');
  } catch (e: any) {
    recordResult('EMU-TENANT-03', 'Multi-Tenancy', 'Cross-business product injection blocked', false, e.message);
  }

  // ==========================================
  // TEST GROUP 3: SUBSCRIPTION EXPIRY ENFORCEMENT
  // ==========================================
  console.log('Executing Test Group 3: Server-Side Subscription Expiry...');
  try {
    // Owner A (active business) creating a sale should SUCCEED
    await assertSucceeds(setDoc(doc(ownerADb, 'businesses/biz_a/sales/sale_legit_1'), {
      id: 'sale_legit_1',
      businessId: 'biz_a',
      totalAmount: 74000,
      items: [{ productId: 'prod_rice', quantity: 1, unitPrice: 74000 }],
      discount: 0,
      createdAt: new Date().toISOString(),
    }));
    recordResult('EMU-SUB-01', 'Subscription', 'Active business sale creation allowed', true, 'Active subscription business A can record sales');
  } catch (e: any) {
    recordResult('EMU-SUB-01', 'Subscription', 'Active business sale creation allowed', false, e.message);
  }

  try {
    // Owner B (expired business) creating a sale should FAIL at rules level
    await assertFails(setDoc(doc(ownerBDb, 'businesses/biz_b/sales/sale_blocked_1'), {
      id: 'sale_blocked_1',
      businessId: 'biz_b',
      totalAmount: 15000,
      items: [{ productId: 'item_1', quantity: 1, unitPrice: 15000 }],
      discount: 0,
      createdAt: new Date().toISOString(),
    }));
    recordResult('EMU-SUB-02', 'Subscription', 'Expired business sale creation blocked', true, 'Expired subscription business B sale creation blocked by isBusinessActive()');
  } catch (e: any) {
    recordResult('EMU-SUB-02', 'Subscription', 'Expired business sale creation blocked', false, e.message);
  }

  try {
    // Owner B attempting to self-upgrade expired plan to active should FAIL
    await assertFails(updateDoc(doc(ownerBDb, 'businesses/biz_b'), {
      planStatus: 'active',
      plan: 'pro',
    }));
    recordResult('EMU-SUB-03', 'Subscription', 'Unauthorized subscription bypass blocked', true, 'Owner B cannot modify planStatus or plan on business document');
  } catch (e: any) {
    recordResult('EMU-SUB-03', 'Subscription', 'Unauthorized subscription bypass blocked', false, e.message);
  }

  // ==========================================
  // TEST GROUP 4: STAFF ROLE PERMISSIONS (RBAC)
  // ==========================================
  console.log('Executing Test Group 4: Staff Role Permissions (RBAC)...');
  try {
    // Cashier recording a sale on active Business A should SUCCEED
    await assertSucceeds(setDoc(doc(cashierADb, 'businesses/biz_a/sales/sale_cashier_1'), {
      id: 'sale_cashier_1',
      businessId: 'biz_a',
      totalAmount: 37000,
      items: [{ productId: 'prod_rice', quantity: 1, unitPrice: 37000 }],
      discount: 0,
      createdAt: new Date().toISOString(),
    }));
    recordResult('EMU-RBAC-01', 'RBAC', 'Cashier allowed to record sales', true, 'Cashier A can record sales in Business A');
  } catch (e: any) {
    recordResult('EMU-RBAC-01', 'RBAC', 'Cashier allowed to record sales', false, e.message);
  }

  try {
    // Cashier trying to DELETE a sale must FAIL (only Owner allowed)
    await assertFails(deleteDoc(doc(cashierADb, 'businesses/biz_a/sales/sale_cashier_1')));
    recordResult('EMU-RBAC-02', 'RBAC', 'Cashier denied deleting sales', true, 'Cashier A cannot delete sales records');
  } catch (e: any) {
    recordResult('EMU-RBAC-02', 'RBAC', 'Cashier denied deleting sales', false, e.message);
  }

  try {
    // Cashier trying to CREATE a new product must FAIL (only Inventory Clerk/Owner)
    await assertFails(setDoc(doc(cashierADb, 'businesses/biz_a/products/prod_new_cashier'), {
      id: 'prod_new_cashier',
      businessId: 'biz_a',
      name: 'Unauthorized Product',
      costPrice: 100,
      sellingPrice: 200,
      quantity: 10,
    }));
    recordResult('EMU-RBAC-03', 'RBAC', 'Cashier denied product creation', true, 'Cashier A cannot create products');
  } catch (e: any) {
    recordResult('EMU-RBAC-03', 'RBAC', 'Cashier denied product creation', false, e.message);
  }

  try {
    // Cashier during checkout updating ONLY quantity & updatedAt must SUCCEED
    await assertSucceeds(updateDoc(doc(cashierADb, 'businesses/biz_a/products/prod_rice'), {
      quantity: 49,
      updatedAt: new Date().toISOString(),
    }));
    recordResult('EMU-RBAC-04', 'RBAC', 'Cashier allowed stock decrement on checkout', true, 'Cashier A can decrement stock during sales checkout');
  } catch (e: any) {
    recordResult('EMU-RBAC-04', 'RBAC', 'Cashier allowed stock decrement on checkout', false, e.message);
  }

  try {
    // Cashier attempting to TAMPER with sellingPrice during stock update must FAIL
    await assertFails(updateDoc(doc(cashierADb, 'businesses/biz_a/products/prod_rice'), {
      quantity: 48,
      sellingPrice: 10, // Attempting to drop price to ₦10!
      updatedAt: new Date().toISOString(),
    }));
    recordResult('EMU-RBAC-05', 'RBAC', 'Cashier pricing tampering blocked', true, 'Cashier A cannot modify sellingPrice during stock update');
  } catch (e: any) {
    recordResult('EMU-RBAC-05', 'RBAC', 'Cashier pricing tampering blocked', false, e.message);
  }

  try {
    // Inventory Clerk updating stock should SUCCEED
    await assertSucceeds(updateDoc(doc(clerkADb, 'businesses/biz_a/products/prod_rice'), {
      quantity: 45,
      updatedAt: new Date().toISOString(),
    }));
    recordResult('EMU-RBAC-06', 'RBAC', 'Inventory Clerk allowed stock update', true, 'Clerk A can manage inventory stock');
  } catch (e: any) {
    recordResult('EMU-RBAC-06', 'RBAC', 'Inventory Clerk allowed stock update', false, e.message);
  }

  try {
    // Inventory Clerk trying to record a sale must FAIL
    await assertFails(setDoc(doc(clerkADb, 'businesses/biz_a/sales/sale_clerk_illegal'), {
      id: 'sale_clerk_illegal',
      businessId: 'biz_a',
      totalAmount: 1000,
      items: [{ productId: 'prod_rice', quantity: 1, unitPrice: 1000 }],
      discount: 0,
      createdAt: new Date().toISOString(),
    }));
    recordResult('EMU-RBAC-07', 'RBAC', 'Inventory Clerk denied sales creation', true, 'Clerk A cannot record sales');
  } catch (e: any) {
    recordResult('EMU-RBAC-07', 'RBAC', 'Inventory Clerk denied sales creation', false, e.message);
  }

  // ==========================================
  // TEST GROUP 5: SUPER ADMIN AUTHORIZATION & PRIVILEGE GUARD
  // ==========================================
  console.log('Executing Test Group 5: Super Admin Security...');
  try {
    // Spoofed admin (email matches but email_verified == false) reading /admins must FAIL
    await assertFails(getDoc(doc(spoofedAdminDb, 'admins/user_super_admin')));
    recordResult('EMU-ADMIN-01', 'SuperAdmin', 'Spoofed admin unverified email blocked', true, 'Unverified email claiming super admin identity rejected');
  } catch (e: any) {
    recordResult('EMU-ADMIN-01', 'SuperAdmin', 'Spoofed admin unverified email blocked', false, e.message);
  }

  try {
    // Verified Super Admin reading /admins must SUCCEED
    await assertSucceeds(getDoc(doc(superAdminDb, 'admins/user_super_admin')));
    recordResult('EMU-ADMIN-02', 'SuperAdmin', 'Verified super admin allowed', true, 'Verified super admin successfully authorized');
  } catch (e: any) {
    recordResult('EMU-ADMIN-02', 'SuperAdmin', 'Verified super admin allowed', false, e.message);
  }

  try {
    // Standard user attempting self-promotion on /users/{uid} to role 'admin' must FAIL
    await assertFails(setDoc(doc(ownerADb, 'users/user_owner_a'), {
      displayName: 'Attacker Owner',
      email: 'owner_a@biz.ng',
      role: 'admin',
    }));
    recordResult('EMU-ADMIN-03', 'SuperAdmin', 'User profile admin elevation blocked', true, 'Standard user cannot self-assign role: admin');
  } catch (e: any) {
    recordResult('EMU-ADMIN-03', 'SuperAdmin', 'User profile admin elevation blocked', false, e.message);
  }

  // ==========================================
  // TEST GROUP 6: AUDIT LOG TAMPER-PROOFING & FORGERY PREVENTION
  // ==========================================
  console.log('Executing Test Group 6: Audit Log Immutability & Forgery Prevention...');
  try {
    // Member recording legitimate audit log with matching performedById must SUCCEED
    await assertSucceeds(setDoc(doc(cashierADb, 'businesses/biz_a/audit_logs/log_cashier_legit'), {
      id: 'log_cashier_legit',
      businessId: 'biz_a',
      performedById: 'user_cashier_a',
      performedBy: 'Musa Cashier',
      action: 'sale_created',
      details: 'Recorded sale receipt REC-001 for ₦37,000',
      createdAt: new Date().toISOString(),
    }));
    recordResult('EMU-AUDIT-01', 'AuditLog', 'Legitimate audit log creation allowed', true, 'Cashier A can record authenticated sale audit log');
  } catch (e: any) {
    recordResult('EMU-AUDIT-01', 'AuditLog', 'Legitimate audit log creation allowed', false, e.message);
  }

  try {
    // Cashier attempting to FORGE performedById as someone else must FAIL
    await assertFails(setDoc(doc(cashierADb, 'businesses/biz_a/audit_logs/log_forged_actor'), {
      id: 'log_forged_actor',
      businessId: 'biz_a',
      performedById: 'user_super_admin', // Impersonating Super Admin!
      performedBy: 'Platform Super Admin',
      action: 'sale_created',
      details: 'Forged audit record',
      createdAt: new Date().toISOString(),
    }));
    recordResult('EMU-AUDIT-02', 'AuditLog', 'Forged audit actor identity blocked', true, 'Cashier cannot impersonate super admin or other user in audit logs');
  } catch (e: any) {
    recordResult('EMU-AUDIT-02', 'AuditLog', 'Forged audit actor identity blocked', false, e.message);
  }

  try {
    // Cashier attempting to forge an administrative action (subscription_changed) must FAIL
    await assertFails(setDoc(doc(cashierADb, 'businesses/biz_a/audit_logs/log_forged_action'), {
      id: 'log_forged_action',
      businessId: 'biz_a',
      performedById: 'user_cashier_a',
      performedBy: 'Musa Cashier',
      action: 'subscription_changed', // Cashier cannot perform administrative actions!
      details: 'Upgraded to Pro Enterprise',
      createdAt: new Date().toISOString(),
    }));
    recordResult('EMU-AUDIT-03', 'AuditLog', 'Unauthorized administrative audit action blocked', true, 'Non-owner cashier cannot record administrative audit actions');
  } catch (e: any) {
    recordResult('EMU-AUDIT-03', 'AuditLog', 'Unauthorized administrative audit action blocked', false, e.message);
  }

  try {
    // Any attempt to UPDATE an existing audit log must FAIL (strictly immutable)
    await assertFails(updateDoc(doc(ownerADb, 'businesses/biz_a/audit_logs/log_cashier_legit'), {
      details: 'Tampered audit record details',
    }));
    recordResult('EMU-AUDIT-04', 'AuditLog', 'Audit log update strictly denied', true, 'Audit log documents cannot be updated by anyone');
  } catch (e: any) {
    recordResult('EMU-AUDIT-04', 'AuditLog', 'Audit log update strictly denied', false, e.message);
  }

  try {
    // Any attempt to DELETE an existing audit log must FAIL (strictly immutable)
    await assertFails(deleteDoc(doc(ownerADb, 'businesses/biz_a/audit_logs/log_cashier_legit')));
    recordResult('EMU-AUDIT-05', 'AuditLog', 'Audit log deletion strictly denied', true, 'Audit log documents cannot be deleted even by business owner');
  } catch (e: any) {
    recordResult('EMU-AUDIT-05', 'AuditLog', 'Audit log deletion strictly denied', false, e.message);
  }

  // Clean up environment
  await testEnv.cleanup();

  // Print Summary
  console.log('\n=============================================================');
  console.log('       REAL FIRESTORE EMULATOR TEST EXECUTION REPORT         ');
  console.log('=============================================================\n');

  const total = emulatorTestResults.length;
  const passed = emulatorTestResults.filter((r) => r.passed).length;
  const failed = total - passed;

  emulatorTestResults.forEach((r) => {
    const symbol = r.passed ? '✓' : '✗';
    console.log(`[${symbol}] ${r.id.padEnd(16)} [${r.category.padEnd(14)}] ${r.name}: ${r.message}`);
  });

  console.log('\n-------------------------------------------------------------');
  console.log(`Real Emulator Tests: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL REAL FIRESTORE EMULATOR SECURITY TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

runRealEmulatorTests().catch((err) => {
  console.error('Test execution failed with fatal error:', err);
  process.exit(1);
});
