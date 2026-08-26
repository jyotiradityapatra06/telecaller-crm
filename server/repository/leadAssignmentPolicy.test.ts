import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalPhone, classifyUploadRow, contactKey, hasActiveAssignment } from './leadAssignmentPolicy';

test('normalizes Indian phone variants to one contact key', () => {
  assert.equal(canonicalPhone('+91 98765-43210'), '9876543210');
  assert.equal(contactKey('org-a', 'APNI_VIDYA', '09876543210'), 'org-a:APNI_VIDYA:9876543210');
});

test('the same lead can be active for Priya and Tejashree', () => {
  const rows = [
    { organizationId: 'org-a', leadId: 'lead-1', telecallerId: 'priya' },
    { organizationId: 'org-a', leadId: 'lead-1', telecallerId: 'tejashree' },
  ];
  assert.equal(hasActiveAssignment(rows, 'org-a', 'lead-1', 'priya'), true);
  assert.equal(hasActiveAssignment(rows, 'org-a', 'lead-1', 'tejashree'), true);
  assert.equal(rows.filter((r) => r.telecallerId === 'priya').length, 1);
});

test('re-upload is idempotent only for the selected telecaller', () => {
  const rows = [{ organizationId: 'org-a', leadId: 'lead-1', telecallerId: 'priya' }];
  assert.equal(classifyUploadRow(true, hasActiveAssignment(rows, 'org-a', 'lead-1', 'priya')), 'already_assigned_to_selected_telecaller');
  assert.equal(classifyUploadRow(true, hasActiveAssignment(rows, 'org-a', 'lead-1', 'tejashree')), 'existing_contact_new_assignment');
});

test('organization and brand remain part of contact identity', () => {
  assert.notEqual(contactKey('org-a', 'APNI_VIDYA', '9876543210'), contactKey('org-b', 'APNI_VIDYA', '9876543210'));
  assert.notEqual(contactKey('org-a', 'APNI_VIDYA', '9876543210'), contactKey('org-a', 'APNI_ESTATE', '9876543210'));
});

test('inactive historical rows do not block a new active assignment', () => {
  const rows = [{ organizationId: 'org-a', leadId: 'lead-1', telecallerId: 'priya', isActive: false }];
  assert.equal(hasActiveAssignment(rows, 'org-a', 'lead-1', 'priya'), false);
});
