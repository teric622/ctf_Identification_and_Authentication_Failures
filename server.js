const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views')); 
const sessions = {
  "YWRtaW5zZXNzaW9u": {
    username: "admin",
    role: "admin",
    expires: Date.now() + 3600000,
  },
  "MTIzNDU=": { 
    username: "user",
    role: "user",
    expires: Date.now() + 3600000, 
  },
};
const encodeBase64 = (str) => Buffer.from(str).toString('base64');
const decodeBase64 = (str) => Buffer.from(str, 'base64').toString('ascii');
const generateSessionId = () => encodeBase64(crypto.randomBytes(4).toString('hex'));
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    const sessionId = username === "admin" ? encodeBase64("adminsession") : generateSessionId();
    sessions[sessionId] = {
      username,
      role: username === "admin" ? "admin" : "user",
      expires: Date.now() + 3600000, 
    };
    res.cookie('sessionid', sessionId);
    res.cookie('debug_token', 'abcdef');
    res.cookie('sessionid_v2', generateSessionId());
    res.send(`
      <h1>Welcome, ${username}!</h1>
      <p>Your session ID is: ${sessionId}</p>
      <a href="/dashboard">Go to Dashboard</a>
    `);
  } else {
    res.status(400).send('<h1>Login Failed</h1>');
  }
});
app.get('/dashboard', (req, res) => {
  const sessionId = req.cookies.sessionid;
  const session = sessions[sessionId];

  if (session && session.expires > Date.now()) {
    res.send(`
      <h1>Dashboard</h1>
      <p>Welcome, ${session.username}!</p>
      <p>Your role is: ${session.role}</p>
      ${session.role === "admin" ?  '<a href="/flag.txt">Access the Flag</a>' : ''}
      ${session.role === "admin" ? `
  <iframe src="https://giphy.com/embed/ysiCYZUJkW3XRb7k9K" 
          width="480" 
          height="480" 
          style="display: block; margin: auto; border: none;" 
          frameBorder="0" 
          class="giphy-embed" 
          allowFullScreen>
  </iframe>
  <p style="text-align: center;">
    <a href="https://giphy.com/gifs/GetPartiful-among-us-imposter-game-ysiCYZUJkW3XRb7k9K" 
       target="_blank">via GIPHY</a>
  </p>
` : ''}

    `);
  } else if (session && session.expires <= Date.now()) {
    res.status(403).send('<h1>Session Expired</h1>');
  } else {
    res.status(401).send('<h1>Unauthorized</h1>');
  }
});
app.get('/flag.txt', (req, res) => {
  const sessionId = req.cookies.sessionid;
  const session = sessions[sessionId];
  const requiredHeader = req.headers['x-custom-header'];

  if (
    session &&
    session.role === "admin" &&
    session.expires > Date.now() &&
    requiredHeader === "letmein"
  ) {
    const flag = encodeBase64("CTF{flag_found_etm_ctf_inception_lost_in_time_not_so_lost_ha}");
    res.send(`Encoded Flag: ${flag}`);
  } else {
    res.status(403).send('<h1>Forbidden</h1>');
  }
});
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
