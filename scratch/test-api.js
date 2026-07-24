const fs = require('fs');
const path = require('path');

// Manually parse env file
let apiKey = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.log('Error reading .env file:', e.message);
}

console.log('Using API Key:', apiKey ? 'FOUND (starts with ' + apiKey.substring(0, 5) + ')' : 'NOT FOUND');

async function test() {
  const prompt = "Diga olá mundo em uma frase curta.";
  
  console.log('\n--- Testando Gemini API ---');
  const startGemini = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    console.log('Gemini Status:', response.status);
    const resData = await response.json();
    console.log('Gemini Time:', Date.now() - startGemini, 'ms');
    console.log('Gemini Response:', JSON.stringify(resData).substring(0, 200));
  } catch (err) {
    console.error('Gemini Error:', err);
  }

  console.log('\n--- Testando n8n Webhook ---');
  const startWebhook = Date.now();
  const webhookUrl = "https://n8n.aegmedia.com.br/webhook/c1d2aa19-2b46-4a31-b16f-d7c64eee11d1";
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test: true,
        report: "Hello from test script"
      }),
    });
    console.log('Webhook Status:', response.status);
    console.log('Webhook Time:', Date.now() - startWebhook, 'ms');
  } catch (err) {
    console.error('Webhook Error:', err);
  }
}

test();
