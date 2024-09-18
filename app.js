const express = require("express");
require("express-async-errors");

const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
//.env stuff
require("dotenv").config(); // to load the .env file into the process.env object

const session = require("express-session");

//OLD way to store 
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//   })
// );

//new way with database 
const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
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

//this comes after app.use for session - connect flash package - collects and saves data from session so not on the server or on req res 
app.use(require("connect-flash")());
//StoreLocals middleware 
app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();
app.use(passport.initialize());
app.use(passport.session());


// let secretWord = "syzygy"; <-- comment this out or remove this line
// app.get("/secretWord", (req, res) => {
//   if (!req.session.secretWord) {
//     req.session.secretWord = "syzygy";
//   }
//   res.locals.info = req.flash("info");
//   res.locals.errors = req.flash("error");
//   res.render("secretWord", { secretWord: req.session.secretWord });
// });
// //new post 
// app.post("/secretWord", (req, res) => {
//   if (req.body.secretWord.toUpperCase()[0] == "P") {
//     req.flash("error", "That word won't work!");
//     req.flash("error", "You can't use words that start with p.");
//   } else {
//     req.session.secretWord = req.body.secretWord;
//     req.flash("info", "The secret word was changed.");
//   }
//   res.redirect("/secretWord");
// });

const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3500;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();