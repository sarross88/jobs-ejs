const express = require("express");
require("express-async-errors");

//security packages 
const helmet = require('helmet')
const cors = require('cors')
const xxs = require('xss-clean')
const rateLimiter = require('express-rate-limit')
//csrf
const csrf = require('host-csrf')

const app = express();

//MONGODB
const MongoDBStore = require("connect-mongodb-session")(session);
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: mongoURL,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
//Stop MONGODB

//FAKER 
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp);

//Passport
const passport = require("passport");
const passportInit = require("./passport/passportInit");

//ABOVE route or posts 
require("dotenv").config(); // to load the .env file into the process.env object
const session = require("express-session");


const jobsRouter = require('./routes/jobs');
app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));


//this comes after app.use for session - connect flash package - collects and saves data from session so not on the server or on req res 
app.use(require("connect-flash")());
//StoreLocals middleware 
app.use(require("./middleware/storeLocals"));

const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");

passportInit();
app.use(passport.initialize());
app.use(passport.session());

//CSRF
// app.use(cookieParser("notverysecret"));
app.use(express.urlencoded({ extended: false }));
let csrf_development_mode = true;
if (app.get("env") === "production") {
  csrf_development_mode = false;
  app.set("trust proxy", 1);
}
const csrf_options = {
  protected_operations: ["PATCH"],
  protected_content_types: ["application/json"],
  development_mode: csrf_development_mode,
};
const csrf_middleware = csrf(csrf_options); 
app.use(csrf_middleware(req,res,next));

app.set('trust proxy', 1);
app.use(rateLimiter({
  windowMS:15 * 60 * 1000, //15mins 
  max:100, //limit 100 req per windowMS
}));
app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(xss())
app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});


//ALL Routes 
app.use("/secretWord", auth, secretWordRouter);
app.use("/sessions", require("./routes/sessionRoutes"));
//NEW JOBS ROUTES 
app.use('/jobs', auth, jobsRouter);

//API TEST 
app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

//ERRORS 
app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});
app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});


const port = process.env.PORT || 3000;
const start = () => {
  try {
    require("./db/connect")(mongoURL);
    return app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };