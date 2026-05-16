const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

function getSecretKey() {
  return process.env.CHAPA_SECRET_KEY || process.env.CHAPA_SECRET || '';
}

async function chapaRequest(path, options = {}) {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw Object.assign(new Error('Chapa secret key is not configured'), { status: 500 });
  }

  const response = await fetch(`${CHAPA_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(payload.message || 'Chapa request failed'), {
      status: response.status,
      payload
    });
  }
  return payload;
}

async function initializePayment(data) {
  return chapaRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function verifyPayment(txRef) {
  return chapaRequest(`/transaction/verify/${encodeURIComponent(txRef)}`, {
    method: 'GET'
  });
}

module.exports = {
  initializePayment,
  verifyPayment
};
