const passport = require('passport');
const { Strategy } = require('passport-local'); // local strategy
const { MongoClient } = require('mongodb'); // DB
const debug = require('debug')('app:localStrategy');

function localStrategy() {

  /**
   * 1. how we deal with username and password
   * 2. how we identify the user
   */
  passport.use(new Strategy( 
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {

      let client;
      try {
        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db(process.env.DB_NAME);
        debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);

        // extract users list
        const col = await db.collection('users');
        const user = await col.findOne( {username})
        debug(user)
        // if user exists and password is correct:
        if (user && user.password === password){
          done(null, user)
        }
        else{
          done(null, false)
        }

      } catch (err) {
        debug(err);
      }
      client.close()
    }
  ));
}

module.exports = localStrategy
