const https = require('https');
https.get('https://en.wikipedia.org/wiki/Addis_Ababa_Institute_of_Technology', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/upload\.wikimedia\.org\/wikipedia\/commons\/[^\"]+/g);
    console.log(match ? [...new Set(match)] : 'No image found');
  });
});
