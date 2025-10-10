const fs = require('fs');

const data = JSON.parse(fs.readFileSync('lhr-1760064050118.json', 'utf8'));

console.log('=== LIGHTHOUSE ANALYSIS ===\n');
console.log('URL:', data.finalUrl);
console.log('Date:', data.fetchTime);
console.log('\n--- PERFORMANCE SCORES ---');
console.log('Overall Performance:', (data.categories.performance.score * 100).toFixed(0) + '%');
console.log('\n--- CORE WEB VITALS ---');
console.log('✓ FCP (First Contentful Paint):', data.audits['first-contentful-paint'].displayValue, '- Score:', data.audits['first-contentful-paint'].score);
console.log('✓ LCP (Largest Contentful Paint):', data.audits['largest-contentful-paint'].displayValue, '- Score:', data.audits['largest-contentful-paint'].score);
console.log('✓ TBT (Total Blocking Time):', data.audits['total-blocking-time'].displayValue, '- Score:', data.audits['total-blocking-time'].score);
console.log('✗ CLS (Cumulative Layout Shift):', data.audits['cumulative-layout-shift'].displayValue, '- Score:', data.audits['cumulative-layout-shift'].score);
console.log('✓ Speed Index:', data.audits['speed-index'].displayValue, '- Score:', data.audits['speed-index'].score);

console.log('\n--- TOP IMPROVEMENT OPPORTUNITIES ---');
const opportunities = Object.values(data.audits)
  .filter(a => a.details && a.details.overallSavingsMs && a.details.overallSavingsMs > 0)
  .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
  .slice(0, 10);

opportunities.forEach((opp, i) => {
  console.log(`${i + 1}. ${opp.title}`);
  console.log(`   Potential Savings: ${opp.details.overallSavingsMs}ms`);
  console.log(`   Current Score: ${opp.score !== null ? opp.score : 'N/A'}`);
});

console.log('\n--- OTHER CATEGORIES ---');
console.log('Accessibility:', (data.categories.accessibility.score * 100).toFixed(0) + '%');
console.log('Best Practices:', (data.categories['best-practices'].score * 100).toFixed(0) + '%');
console.log('SEO:', (data.categories.seo.score * 100).toFixed(0) + '%');
