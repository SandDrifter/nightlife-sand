"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var path = require("path");
var router = express.Router();
var Yelp = require("yelp");
var mongoose = require("mongoose");
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;
var url = require('url');
var secret = require("./config");

//var cookieParser = require('cookie-parser');

var sitesUrl = "https://dynamic-web-application-projects-sanddrifter.c9users.io/";

passport.use(new Strategy({
    consumerKey: secret.consumerKey,
    consumerSecret: secret.consumerSecret,
    callbackURL: sitesUrl
  },
function(token, tokenSecret, profile, cb) {
    // In this example, the user's Twitter profile is supplied as the user
    // record.  In a production-quality application, the Twitter profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    console.log("profile.id is:" + profile.id);
    process.nextTick(function(){
        userData.findOne({ twitterId: profile.id }, function (err, user) {
            if(err){console.log(err);}
            console.log("found user in the database his id is:" + user.id);
            if(user){
                console.log('user found')
            }else{
            console.log('creating new user in the databse');
            var newUser = new userData({id:profile.id});
            newUser.save();
            }
         // return cb(err, user);
        });
    });
    
    return cb(null, profile);
  }));

//setting up databse
var urlDB = secret.urlDB;
mongoose.connect(urlDB, function(err){
    if(err){console.log(err);}
    console.log("connected to the database");
});
var Schema = mongoose.Schema;
var barSchema = new Schema({
//ex:
	barId:{type:String, required:true},
	goes:String
},{collection:'bars'});
var barsData = mongoose.model('bars', barSchema);

var userScehma = new Schema({
    twitterId:String,
},{collection:'users'});
var userData = mongoose.model('users', userScehma);

//configure app
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//use middleware //note:The order of middleware is important
//app.use(cookieParser);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());//router use bodyParser() istead of app.use(bodyPareser())
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(router);

// Initialize Passport and restore authentication state, if any, from the
// session.

var yelp = new Yelp({
  consumer_key: 'zqjS5cejvwnPRWepDjy1dA',
  consumer_secret: 'PixqNK1aGqBB1kGYl4dTmVT5zzI',
  token: '7xeoSOJZyGeUiZvGPLsbQEgsFPZLCGFz',
  token_secret: '7AVZW_WS21aC5NiXSImKVoMYp_s'
});

router.get('/',  function(req, res){
var    data = {
        businesses: []
    }
    
         res.render('index',{text:data});
});

var count =0;
var tempBarData={} ;

router.post('/yelp',function(req, res){
    yelp.search({ term: 'bar', location: req.body.searchText})
  .then(function (data) {
      console.log("\nreseting count value for checkHowManyGoesToBar recursive function");
      count = 0;
      tempBarData ={};
      checkHowManyGoesToBar(data);
      function checkHowManyGoesToBar(data){
      barsData.findOne({barId: data.businesses[count].id}, function(err, bar){
          if(err){
              console.log(err);
          }else if(!bar){
              console.log("No data that some1 goes to the bar found, saving data that goes:0");
              var item = {
                  barId: data.businesses[count].id,
                  goes:0
              }
              var someData = new barsData(item);
              someData.save();
              tempBarData[data.businesses[count].id] = item;
          }else{
              console.log("Found that " + bar.goes +" people are going to bar which barId is:" + bar.barId);
              tempBarData[data.businesses[count].id] = bar;
          }
          
          count++;
      }) .exec(function (err, bar) {
          if(err){console.log(err);}
      if(count<data.businesses.length){
          console.log("repeating the check how many people are going to the bar");
          checkHowManyGoesToBar(data);
      }else{
          console.log("rendering the view\n");
        //  console.log("bar data", tempBarData);
          res.render('index',{text:data,barsData:tempBarData});
      }
        });
      }
    });
});


  
passport.serializeUser(function(user, cb) {
    console.log("in serializeUser");
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    console.log("in deserializeUser");
  cb(null, obj);
});

router.get('/login/twitter',
  passport.authenticate('twitter'));
  
router.get('/login/twitter/return', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
  
  function authenticatedOrNot(req, res, next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.redirect("/login");
    }
}

router.post('/going', function(req, res){
    console.log('barID:'+ req.body.barId );
    console.log('going:'+ req.body.going );
     var conditions = { barId: req.barId }
  , update = { $inc: { goes: req.going }}
  , options = { multi: true };
  
barsData.update(conditions, update, options, function(){console.log('bar updated')});
    res.send('');
});
   
app.get("/public/index.js", function(req, res) {
    //example: /poll?id=123
   
    res.sendFile(path.join(__dirname , '/public/index.js'));
});

app.set('port',(process.env.PORT || 8080) );
app.listen(app.get('port'),function(){
    console.log("listenning port on:" + app.get('port'));
});


