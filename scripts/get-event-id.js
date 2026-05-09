const https = require('https');

const url = 'https://cal.com/api/trpc/public/event.get?input=' + encodeURIComponent(JSON.stringify({ json: { username: "ariel-altamirano-j3amfh", eventSlug: "test-calendar" } }));

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("Event Type ID:", parsed?.result?.data?.json?.id);
    } catch (e) { console.error(e); }
  });
}).on("error", (err) => { console.log("Error: " + err.message); });
