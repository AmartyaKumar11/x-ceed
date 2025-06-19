// Quick script to share the existing test document with your email
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function shareTestDocument() {
  const documentId = '1yB_2HkESo-TPWC5btum5_ReUkdYqTddicKoZHvsQFNw';
  const userEmail = 'kumaramartya11@gmail.com';
  
  try {
    const response = await fetch('http://localhost:3002/api/google-integration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'share_document',
        data: {
          documentId: documentId,
          userEmail: userEmail
        }
      })
    });

    const result = await response.json();
    console.log('Share result:', result);
  } catch (error) {
    console.error('Error sharing document:', error);
  }
}

shareTestDocument();
