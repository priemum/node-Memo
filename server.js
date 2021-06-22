//jshint version:6
if(process.env.NODE_ENV !== "production"){
  require('dotenv').config();
}
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.set("views",__dirname+"/views");
app.use(bodyParser.urlencoded({
  extended :true
}));

app.use(cookieParser());
app.use(session({
  resave:true,
  saveUninitialized:true,
  secret:process.env.SECRET,
  cookie:{maxAge:3600000*24}
}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on("error",error => console.log(error));
db.once("open", () => console.log("Connected with MongoDB"));


const memoSchema = new mongoose.Schema({
  topic: String,
  title: String,
  content: String,
});

const Memo = new mongoose.model("Memo",memoSchema);

const userSchema = new mongoose.Schema({
  username:String,
  email: String,
  password: String,
  googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);


passport.use(User.createStrategy());

//Works just for local authentication
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//Works for any other kind of authenticaton
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/memos",
    callbackURL: "https://programming-memo.herokuapp.com/auth/google/memos",
    passReqToCallback   : true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_APP_ID,
//     clientSecret: process.env.FACEBOOK_APP_SECRET,
//     callbackURL: "http://localhost:3000/auth/facebook/memos"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));
//
// passport.use(new GitHubStrategy({
//     clientID: process.env.GITHUB_APP_ID,
//     clientSecret: process.env.GITHUB_APP_SECRET,
//     callbackURL: "http://localhost:3000/auth/github/memos"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     User.findOrCreate({ githubId: profile.id }, function (err, user) {
//       // console.log(profile);
//       return done(err, user);
//     });
//   }
// ));



//Register
app.post("/register",function(req,res){
  User.register({username: req.body.username, email: req.body.email}, req.body.password,function(err,use){
    if (err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res, function(){
        res.redirect("/memos");
      });
    }
  });
});

//Login
app.post("/login",function(req,res){
  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local",)(req,res, function(){
        res.redirect("/memos");
      });
    }
  })
});

//Submit memo
app.post("/submit", function(req,res){

const memo = new Memo({
  topic: req.body.topic,
  title: req.body.title,
  content: req.body.content,
});
memo.save(function(err){
  if(!err){
    res.redirect("/memos");
  }
});
});

app.get("/",function(req,res){
  res.render("home");
});


//Google login
app.get("/auth/google",
passport.authenticate('google', {
  scope:  [ "email",
  "profile" ]
}
));

//Google authentication with passport
app.get("/auth/google/memos",
    passport.authenticate( "google", {
        successRedirect: "/memos",
        failureRedirect: "/login"
}));

//Facebook login
app.get("/auth/facebook",
  passport.authenticate("facebook"));

//Facebook authentication with passport
app.get("/auth/facebook/memos",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/memos");
  });

//Github login
app.get("/auth/github",
  passport.authenticate("github", { scope: [ 'user:email' ] }));

//Github authentication with passport
app.get("/auth/github/memos",
  passport.authenticate("github", {  failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/memos");
  });

app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/memos",function(req,res){
  if(req.isAuthenticated()){
    Memo.find({},function(err,memos){
       res.render("memos",{
         memos: memos
       });
    });
  } else{
    res.redirect("/");
  }

});
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.listen(process.env.PORT || 3000);
console.log("Server is running at port 3000");
