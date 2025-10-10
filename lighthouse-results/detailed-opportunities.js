const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lhr-1760064050118.json', 'utf8'));

console.log('=== DETAILED PERFORMANCE ANALYSIS ===');
console.log('Page:', data.finalUrl);
console.log('Date:', new Date(data.fetchTime).toLocaleString());
console.log('\n--- CRITICAL ISSUES ---\n');

// CLS Details
const cls = data.audits['cumulative-layout-shift'];
console.log('🔴 CRITICAL: Cumulative Layout Shift (CLS)');
console.log('   Score:', cls.score, '(Target: > 0.9)');
console.log('   Value:', cls.displayValue, '(Target: < 0.1)');
console.log('   Issue: Layout shifts are severely impacting user experience');
if (cls.details && cls.details.items) {
  console.log('   Elements causing shifts:', cls.details.items.length);
}
console.log('');

// Find all performance-related audits with issues
const performanceIssues = Object.values(data.audits)
  .filter(a => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'notApplicable')
  .sort((a, b) => a.score - b.score);

console.log('--- PERFORMANCE AUDITS BELOW 90% ---\n');
performanceIssues.forEach(audit => {
  const icon = audit.score === 0 ? '🔴' : audit.score < 0.5 ? '🟠' : '🟡';
  console.log(`${icon} ${audit.title}`);
  console.log(`   Score: ${(audit.score * 100).toFixed(0)}%`);
  if (audit.displayValue) {
    console.log(`   Value: ${audit.displayValue}`);
  }
  if (audit.description) {
    const desc = audit.description.split('[Learn')[0].trim();
    console.log(`   Info: ${desc.substring(0, 100)}${desc.length > 100 ? '...' : ''}`);
  }
  console.log('');
});

// Diagnostics
console.log('\n--- DIAGNOSTICS ---\n');
const diagnostics = [
  'total-byte-weight',
  'dom-size',
  'bootup-time',
  'mainthread-work-breakdown',
  'uses-responsive-images',
  'uses-optimized-images',
  'modern-image-formats',
  'efficient-animated-content',
  'unused-css-rules',
  'unused-javascript',
  'uses-text-compression',
  'render-blocking-resources'
];

diagnostics.forEach(key => {
  const audit = data.audits[key];
  if (audit && audit.score !== null && audit.score < 1) {
    console.log(`• ${audit.title}`);
    console.log(`  Score: ${(audit.score * 100).toFixed(0)}%`);
    if (audit.displayValue) {
      console.log(`  Value: ${audit.displayValue}`);
    }
    if (audit.numericValue) {
      console.log(`  Numeric: ${audit.numericValue.toFixed(0)} ${audit.numericUnit || ''}`);
    }
  }
});
