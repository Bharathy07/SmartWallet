const axios = require('axios');
const base = 'http://localhost:5000/api';

async function request(url, method = 'get', data = null, headers = {}) {
  try {
    const response = await axios({ url, method, data, headers, timeout: 10000 });
    console.log('OK', method.toUpperCase(), url, response.status, response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('ERROR', method.toUpperCase(), url, error.response.status, error.response.data);
      return { error: error.response.data, status: error.response.status };
    }
    console.error('ERROR', method.toUpperCase(), url, error.message);
    return { error: error.message, status: null };
  }
}

(async () => {
  const password = 'Password1!';
  const userA = { name: 'Debug A', email: `debugA+${Date.now()}@example.com`, password, confirmPassword: password };
  const userB = { name: 'Debug B', email: `debugB+${Date.now()}@example.com`, password, confirmPassword: password };

  await request(`${base}/auth/signup`, 'post', userA);
  await request(`${base}/auth/signup`, 'post', userB);

  const loginA = await request(`${base}/auth/login`, 'post', { email: userA.email, password });
  if (!loginA || !loginA.token) {
    console.error('Login A failed, aborting');
    return;
  }

  const token = loginA.token;
  const headers = { Authorization: `Bearer ${token}` };
  const usersResp = await request(`${base}/users`, 'get', null, headers);

  const recipient = Array.isArray(usersResp) ? usersResp.find((u) => u.email === userB.email) : null;
  if (!recipient) {
    console.error('Recipient not found');
    return;
  }

  await request(`${base}/transactions/send`, 'post', {
    fromUserId: loginA.user.id,
    toUserId: recipient._id,
    amount: 10,
  }, headers);
})();
