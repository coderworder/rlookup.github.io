const express = require('express');
const fetch = require('node-fetch'); // npm i node-fetch@2
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins, adjust in prod!
app.use(express.json());

app.post('/api/userinfo', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Step 1: Get user ID from username
    const userLookupResponse = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username] }),
    });

    if (!userLookupResponse.ok) {
      return res.status(502).json({ error: 'Failed to fetch user data from Roblox' });
    }

    const userLookupData = await userLookupResponse.json();

    if (!userLookupData.data || userLookupData.data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userLookupData.data[0];

    // Step 2: Get detailed user info (including creation date)
    const userInfoResponse = await fetch(`https://users.roblox.com/v1/users/${user.id}`);
    if (!userInfoResponse.ok) {
      return res.status(502).json({ error: 'Failed to fetch user info from Roblox' });
    }

    const userInfo = await userInfoResponse.json();

    if (!userInfo.created) {
      return res.status(502).json({ error: 'User creation date not found' });
    }

    // Return only needed info
    return res.json({
      username: user.name,
      created: userInfo.created,
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Roblox proxy server running on http://localhost:${PORT}`);
});
