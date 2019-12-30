require('./strategies/local.strategy')()
const passport = require('passport');

function passportConfig(app) {

  app.use(passport.initialize()); // set passport up
  app.use(passport.session()); // build up the session

  passport.serializeUser((user, done)=>{ // Stores the user in the session   
    done(null, user)
  }); 
  passport.deserializeUser((user, done)=>{ // Retrieve the user from session
    done(null, user)
  }); 

}

module.exports = passportConfig