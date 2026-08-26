export type AssignmentIdentity = { organizationId: string; leadId: string; telecallerId: string; isActive?: boolean };

export const canonicalPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const contactKey = (organizationId: string, brand: string, phone: string): string =>
  `${organizationId}:${brand}:${canonicalPhone(phone)}`;

export const hasActiveAssignment = (
  assignments: AssignmentIdentity[], organizationId: string, leadId: string, telecallerId: string
): boolean => assignments.some((item) => item.organizationId === organizationId && item.leadId === leadId && item.telecallerId === telecallerId && item.isActive !== false);

export const classifyUploadRow = (contactExists: boolean, assignedToSelected: boolean) =>
  !contactExists ? 'new_contact' : assignedToSelected ? 'already_assigned_to_selected_telecaller' : 'existing_contact_new_assignment';
