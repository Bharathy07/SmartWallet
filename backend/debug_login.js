const axios = require('axios');

(async () => {
  try {
    const resp = await axios.post(
      'http://localhost:5000/api/auth/login',
      { email: 'debugA+1784024534908@example.com', password: 'Password1!' },
      { timeout: 10000 }
    );
    console.log('LOGIN OK', resp.status, resp.data);
  } catch (err) {
    console.error('LOGIN ERROR CODE', err.code);
    console.error('LOGIN ERROR MESSAGE', err.message);
    if (err.response) {
      console.error('LOGIN RESPONSE STATUS', err.response.status);
      console.error('LOGIN RESPONSE DATA', err.response.data);
    }
    if (err.request) {
      console.error('LOGIN REQUEST SENT', err.request._header || err.request);
    }
  }
})();
