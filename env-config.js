window.process = window.process || {};
window.process.env = window.process.env || {};
Object.assign(window.process.env, {
  API_KEY: '',
  BFL_API_KEY: ''
});
console.log('env-config.js created by Netlify build: API keys configured. Gemini key found: false, BFL.ai key found: false');