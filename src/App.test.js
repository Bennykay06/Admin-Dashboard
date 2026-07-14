import { getStatusLabel, getPriorityLabel } from './data/mockData';

test('getStatusLabel returns correct labels', () => {
  expect(getStatusLabel('pending')).toBe('Pending');
  expect(getStatusLabel('scheduled')).toBe('Scheduled');
  expect(getStatusLabel('in-progress')).toBe('In Progress');
  expect(getStatusLabel('resolved')).toBe('Resolved');
  expect(getStatusLabel('unknown')).toBe('Unknown');
});

test('getPriorityLabel returns correct labels', () => {
  expect(getPriorityLabel('high')).toBe('🔥 High');
  expect(getPriorityLabel('medium')).toBe('⚡ Medium');
  expect(getPriorityLabel('low')).toBe('💤 Low');
  expect(getPriorityLabel('unknown')).toBe('Unknown');
});
