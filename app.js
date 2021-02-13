const path = require('path');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDBStore = require('connect-mongodb-session')(session);

const app = express();
const store = new mongoDBStore({
  uri: process.env.DB_URL,
  collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorController = require('./controllers/error');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id) // Get the userId stored in the session
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
})

const User = require('./models/user');

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    User
      .findOne()
      .then(user => {
        if (!user) { // Prevent saving a new user every time the app reloads
          const user = new User({
            name: 'Sabine',
            email: 'sabine@test.com',
            cart: {
              items: []
            }
          }); // Initialize the app with a pre-configured user
          user.save(); // Save the created user to MongoDB
        }
      })

    app.listen(3000);
    console.log("---------------")
    console.log("Connected to DB")
  })
  .catch(err => {
    console.log("---------------")
    console.log("Error connecting to DB", err);
    console.log("---------------")
    console.log("Check your IPs List in MongoDB > Network Access"
    )
  })