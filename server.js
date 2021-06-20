//jshint version:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();

mongoose.connect(process.env.DATABASE_URL,{useNewUrlParser:true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on("error",error => console.log(error));
db.once("open", () => console.log("Connected with MongoDB"));

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({
  extended :true
}));

app.get("/",function(req,res){
  res.render("home");
});
app.get("/login",function(req,res){
  res.render("login");
})
app.get("/register",function(req,res){
  res.render("register");
})
app.get("/memos",function(req,res){
  res.render("memos");
})

app.listen(process.env.PORT || 3000);
console.log("Server is running at port 3000");
