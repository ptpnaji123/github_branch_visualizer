const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config(); // Load environment variables

const app = express();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// ✅ GitHub OAuth Authentication
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: 'http://localhost:5000/auth/github/callback',
            scope: ['repo'],
        },
        (accessToken, refreshToken, profile, done) => {
            return done(null, { profile, accessToken });
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.get('/auth/github', passport.authenticate('github'));

app.get(
    '/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect(`http://localhost:3000/dashboard?token=${req.user.accessToken}`);
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// ✅ Fetch repositories of the authenticated user
app.get('/repos', async (req, res) => {
    const { token } = req.query;
    try {
        const response = await axios.get('https://api.github.com/user/repos', {
            headers: { Authorization: `Bearer ${token}` },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Fetch branches of a specific repository
app.get('/branches/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;
    const { token } = req.query;
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Fetch Pull Requests
app.get('/pulls/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;
    const { token } = req.query;
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Fetch Issues
app.get('/issues/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;
    const { token } = req.query;
    try {
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues?state=all`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Start the server
app.listen(5000, () => console.log('Server running on port 5000'));
