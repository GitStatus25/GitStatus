const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const AuthService = require('../services/AuthService');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await AuthService.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    scope: ['user', 'repo']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await AuthService.handleGitHubAuth(profile, accessToken);
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;
