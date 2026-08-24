import { FollowUp, Lead } from '../types';

// Helper: Convert "04:30 PM" to "16:30"
export function timeTo24Hour(time12h: string): string {
  if (!time12h) return '12:00';
  const parts = time12h.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!parts) return '12:00';
  let hours = parseInt(parts[1], 10);
  const minutes = parts[2];
  const modifier = parts[3] ? parts[3].toUpperCase() : 'AM';

  if (hours === 12) {
    hours = modifier === 'PM' ? 12 : 0;
  } else if (modifier === 'PM') {
    hours += 12;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Never called';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

export function getFollowUpCategory(
  followUp?: FollowUp
): 'overdue' | 'today' | 'upcoming' | null {
  if (!followUp || followUp.isCompleted) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const dueDate = followUp.dueDate;

  if (dueDate < todayStr) return 'overdue';
  if (dueDate === todayStr) return 'today';
  return 'upcoming';
}
