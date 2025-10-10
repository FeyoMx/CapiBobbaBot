const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.json')).sort();

console.log('=== LIGHTHOUSE TREND ANALYSIS ===\n');
console.log('Total Reports:', files.length, '\n');

const results = files.map(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const timestamp = new Date(data.fetchTime);

  return {
    file,
    timestamp,
    url: data.finalUrl,
    performance: (data.categories.performance.score * 100).toFixed(0),
    fcp: data.audits['first-contentful-paint'].displayValue,
    lcp: data.audits['largest-contentful-paint'].displayValue,
    tbt: data.audits['total-blocking-time'].displayValue,
    cls: data.audits['cumulative-layout-shift'].displayValue,
    si: data.audits['speed-index'].displayValue,
    accessibility: (data.categories.accessibility.score * 100).toFixed(0),
    bestPractices: (data.categories['best-practices'].score * 100).toFixed(0),
    seo: (data.categories.seo.score * 100).toFixed(0)
  };
});

console.log('| # | Time | URL | Perf | FCP | LCP | TBT | CLS | SI |');
console.log('|---|------|-----|------|-----|-----|-----|-----|-------|');

results.forEach((r, i) => {
  const time = r.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const urlShort = r.url.split('/').pop() || 'root';
  console.log(`| ${i+1} | ${time} | ${urlShort} | ${r.performance}% | ${r.fcp} | ${r.lcp} | ${r.tbt} | ${r.cls} | ${r.si} |`);
});

console.log('\n--- SCORE TRENDS ---');
console.log('Performance: Min', Math.min(...results.map(r => parseInt(r.performance))), '% → Max', Math.max(...results.map(r => parseInt(r.performance))), '%');
console.log('Accessibility: Min', Math.min(...results.map(r => parseInt(r.accessibility))), '% → Max', Math.max(...results.map(r => parseInt(r.accessibility))), '%');
console.log('Best Practices: Min', Math.min(...results.map(r => parseInt(r.bestPractices))), '% → Max', Math.max(...results.map(r => parseInt(r.bestPractices))), '%');
console.log('SEO: Min', Math.min(...results.map(r => parseInt(r.seo))), '% → Max', Math.max(...results.map(r => parseInt(r.seo))), '%');
