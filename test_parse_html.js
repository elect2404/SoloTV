const fs = require('fs');
const html = fs.readFileSync('temp_channel_page.html', 'utf8');

// Find all script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1];
    if (content.includes('streams') && content.includes('url')) {
        console.log(`Script containing streams/url ${count++} (length ${content.length}):`);
        console.log(content.slice(0, 1000));
        console.log('...\n');
    }
}
