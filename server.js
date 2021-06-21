//jshint version:6
if(process.env.NODE_ENV !== "production"){
  require('dotenv').config();
}
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.set("views",__dirname+"/views");
app.use(bodyParser.urlencoded({
  extended :true
}));


mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on("error",error => console.log(error));
db.once("open", () => console.log("Connected with MongoDB"));

const userSchema ={
  email: String,
  password: String
};
const User = new mongoose.model("User",userSchema);

  //Register
app.post("/register",function(req,res){
  const newUser = new User({
    email:req.body.username,
    password: md5(req.body.password)
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    } else{
      res.render("memos");
    }
  });


});


  //Login
app.post("/login",function(req,res){
  const username = req.body.username;
  const password = md5(req.body.password);
  User.findOne({email: username},function(err,foundUser){
    if(err){
      console.log(err);
    } else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("memos");
        }
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
  res.render("memos");
});
app.get("/submit",function(req,res){
  res.render("submit");
});
app.get("/logout",function(req,res){
  res.render("home");
});


app.listen(process.env.PORT || 3000);
console.log("Server is running at port 3000");
