const express = require('express');
const authRouter = express.Router();
const debug = require('debug')('app:authRoutes');
const { MongoClient } = require('mongodb');
const passport = require('passport')


function router(nav) {

  // signup endpoint
  authRouter.route('/signup')
    // POST /auth/signup
    .post(async (req, res) => {
      const { username, password } = req.body;

      // if username or password weren't provided: 
      // go back to signup page and print message
      if (!username || !password) {
        debug("missing parameters")
        res.render('index', {
          nav,
          msg: "User name or Password are missing"
        })
      }

      else {
        // create a user
        let client;
        try {
          client = await MongoClient.connect(process.env.DB_URL);
          const db = client.db(process.env.DB_NAME);
          debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);

          const col = await db.collection('users');
          const user = { username, password };

          const alreadyExists = await col.findOne({ username })

          // if user is already exists:
          // go back to signup page and print message
          if (alreadyExists) {
            res.render('index', {
              nav,
              msg: "User already exists"
            })
          }

          else {
            // insert the user to DB 
            // redirect to the user's notes page
            const results = await col.insertOne(user)
            const result = results.ops[0]

            //log him in
            req.login(result, () => {
              req.session.user = result
              res.redirect('/notes')
            })
          }

        } catch (err) {
          debug(err);
        }
      }
    })


  // logout endpoint
  authRouter.route('/logout')
    // GET /auth/logout
    .get((req, res) => {
      // logout and redirect to homepage
      req.logout()
      req.session.user = undefined
      res.redirect('/')
    })


  // login endpoint - in case user failed login with /auth/signin
  // this endpoint exists because i couldn't deliver merror message to be displayed if signin was un-sucssesfull
  authRouter.route('/login')
    // GET /auth/login
    .get((req, res) => {
      res.render('login', {
        nav,
        title: 'Log In"'
      })
    })

  //signin endpoint
  authRouter.route('/signin')
    // GET /auth/signin
    .get((req, res) => {
      res.render('signin', {
        nav,
        title: 'Sign In"'
      })
    })
    // POST /auth/signin
    .post(async (req, res, next) => {
      const { username } = req.body;
      let client;
      try {
        // get the user details from DB

        client = await MongoClient.connect(process.env.DB_URL);
        const db = client.db(process.env.DB_NAME);
        debug(`Connected to server at ${process.env.DB_URL}/${process.env.DB_NAME}`);

        const col = await db.collection('users');
        const user = await col.findOne({ username })
        req.session.user = user

      } catch (err) {
        debug(err);
      }

      next()
    },
      
    // let passport do the authentication:
      // in sucsses - redirect to user's notes page
      // in failure - redirect to /auth/login with error message
      passport.authenticate('local', {
        successRedirect: '/notes',
        failureRedirect: '/auth/login',
      })
    )

  return authRouter
}


module.exports = router;