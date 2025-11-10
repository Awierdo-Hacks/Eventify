// Generate secure NEXTAUTH_SECRET
// Run: node generate-secret.js

const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('\n🔐 Generated NEXTAUTH_SECRET:\n');
console.log(generateSecret());
console.log('\n💡 Add this to your .env file or Render environment variables\n');
