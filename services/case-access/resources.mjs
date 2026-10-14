// Add approved resources only when supplied. Keep confidential files out of website/.
// Demo entries must use a PRIVATE Worker service binding, not a public upstream URL.
// Example: 'digital-toll': { demoPath: '/digital-toll/', fileKey: 'digital-toll/brief.pdf', fileName: 'brief.pdf' }
export const resources = {
  'industrial-modeling': {demoPath: '/industrial-modeling/'}
};
