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
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.set("views",__dirname+"/views");
app.use(bodyParser.urlencoded({
  extended :true
}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on("error",error => console.log(error));
db.once("open", () => console.log("Connected with MongoDB"));


const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  topic: String,
  title: String,
  content: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

//Works just for local authentication
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Register
app.post("/register",function(req,res){
  User.register({username: req.body.username}, req.body.password,function(err,use){
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
        res.redirect("/secrets");
      });
    }
  })
});

//Submit memo
app.post("/submit",function(req,res){
  const submitedTopic = req.body.topic;
  const submitedTitle = req.body.title;
  const submitedContent = req.body.content;
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser){
        foundUser.topic = submitedTopic;
        foundUser.title = submitedTitle;
        foundUser.content = submitedContent;
        foundUser.save(function(){
          res.redirect("/memos");
        });
      }
    }
  });
});

app.get("/",function(req,res){
  res.render("home");
});
app.get("/login",function(req,res){
  res.render("login");
});
app.get("/register",function(req,res){
  res.render("register");
});
app.get("/memos",function(req,res){
  User.find({"topic":{$ne: null},"title":{$ne: null},"content":{$ne: null}}, function(err,foundUsers){
    if(err){
      console.log(err);
    } else {
      if(foundUsers) {
        res.render("memos",{usersWithMemos: foundUsers});
      }
    }
  });
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
