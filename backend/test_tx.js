const axios = require('axios');

async function test() {
  try {
    // Create two users
    const user1 = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'User1',
      email: `user1+${Date.now()}@test.com`,
      password: 'Pass123!',
      confirmPassword: 'Pass123!'
    });
    console.log('✓ User1 created');

    const user2 = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'User2',
      email: `user2+${Date.now()}@test.com`,
      password: 'Pass123!',
      confirmPassword: 'Pass123!'
    });
    console.log('✓ User2 created');

    // Login as user1
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: user1.data.user.email,
      password: 'Pass123!'
    });
    console.log('✓ Logged in as user1');

    const token = login.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Try to send money
    console.log('\nAttempting transaction...');
    const tx = await axios.post(
      'http://localhost:5000/api/transactions/send',
      {
        fromUserId: user1.data.user.id,
        toUserId: user2.data.user.id,
        amount: 50
      },
      { headers }
    );
    console.log('✓ Transaction successful:', tx.data);
  } catch (err) {
    console.error('\n✗ ERROR:', err.response?.status, err.response?.data || err.message);
  }
}

test();
