import { BusinessBrand, User } from '../src/types';

export function assertValidRoleBrand(user: User): void {
  if (user.role === 'OWNER' && user.brandAccess !== 'BOTH') throw new Error('Forbidden: OWNER must have BOTH brand access.');
  if (user.role !== 'OWNER' && user.brandAccess === 'BOTH') throw new Error('Forbidden: Only OWNER may have BOTH brand access.');
}

export function scopedBrand(user: User, requested?: 'ALL' | BusinessBrand): 'ALL' | BusinessBrand {
  assertValidRoleBrand(user);
  if (user.role === 'OWNER') return requested || 'ALL';
  if (user.role === 'HR') {
    if (requested && requested !== 'ALL' && requested !== user.brandAccess) {
      throw new Error('Forbidden: Requested brand is outside your HR scope.');
    }
    return user.brandAccess as BusinessBrand;
  }
  return user.brandAccess as BusinessBrand;
}

export function assertManagement(user: User): void {
  if (user.role !== 'OWNER' && user.role !== 'HR') throw new Error('Forbidden: Management authorization required.');
  assertValidRoleBrand(user);
}

export function assertCanManageTelecaller(manager: User, telecaller: User): void {
  assertManagement(manager);
  if (telecaller.role !== 'TELECALLER') throw new Error('Forbidden: Target user is not a telecaller.');
  if (telecaller.brandAccess === 'BOTH') throw new Error('Forbidden: Telecaller cannot have BOTH brand access.');
  if (manager.role === 'HR' && telecaller.brandAccess !== manager.brandAccess) {
    throw new Error('Forbidden: Telecaller is outside your HR brand scope.');
  }
}

export function assertLeadAccess(user: User, lead: { brand: BusinessBrand; assignedTo: string | null }): void {
  assertValidRoleBrand(user);
  if (user.role === 'HR' && lead.brand !== user.brandAccess) throw new Error('Forbidden: Lead is outside your HR brand scope.');
  if (user.role === 'TELECALLER' && (lead.brand !== user.brandAccess || lead.assignedTo !== user.id)) {
    throw new Error('Forbidden: Lead is not assigned to you.');
  }
}
