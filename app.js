/* eslint linebreak-style: ["error", "windows"] */


const express = require('express');
const debug = require('debug')('app'); // replace console.log, will print messages only on debug mode
const morgan = require('morgan'); // REST logger
const path = require('path');
const bodyParser = require('body-parser'); // poll out the post and add it to the body
const cookieParser = require('cookie-parser'); // poll the cookies from a request
const session = require('express-session');

// const mongoose = require('mongoose')
// mongoose.connect(process.env.DB_URL, { useNewUrlParser: true })
// const db = mongoose.connection
// db.on('error', (error) => console.error(error))
// db.once('open', () => console.log('Connected to Database'))

const app = express();
app.use(morgan('tiny')); // add logs for REST comunication
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
require('./src/config/passport.js')(app);  // passport configurations
app.use(cookieParser());
app.use(session({ secret: 'RontoDoApp' }));
app.set('views', './src/views');; // set views location
app.set('view engine', 'ejs'); // set views engine


// Static files - node moduls:
const pwd = __dirname;   // __dirname: the location of the current executeable
app.use(express.static(path.join(pwd, 'public')));
app.use('/css', express.static(path.join(pwd, '/node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(pwd, '/node_modules/bootstrap/dist/js')));
app.use('/js', express.static(path.join(pwd, '/node_modules/jquery/dist')));


const port = process.env.PORT || 3000
const nav = [ // navigation tabs, passes as argument to the html files
  { link: '/notes', title: 'Notes' },
  { link: '/about', title: 'About' }
]


// routers
const noteRouter = require('./src/routes/noteRoutes')(nav)
const authRouter = require('./src/routes/authRoutes')(nav)
app.use('/notes', noteRouter);
app.use('/auth', authRouter);


app.get('/', (req, res) => {
  res.render('index', // render to index.ejs view
    {
      nav,
      msg: ""
    }
  );
});

app.get('/about', (req, res) => {
  res.render('about', // render to about.ejs view
    {
      nav
    }
  );
});


app.listen(port, () => {
  debug(`listening on port ${port}`);
});
