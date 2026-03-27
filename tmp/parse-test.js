const fs = require('fs');
let html = fs.readFileSync('tmp/firecrawl_output.html', 'utf8');

// The same regexes used in scrape-property:
html = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

console.log('Parsed text length:', html.length);
console.log('First 1000:\n', html.substring(0, 1000));
console.log('\n\nLast 1000:\n', html.substring(html.length - 1000));
