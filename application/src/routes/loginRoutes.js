/*
Author: Raya Farshad
Description: API for user registration, Login, Logout and authentication.
*/

const express = require("express");
const router = express.Router();
const { User } = require("../models/user.js");
const passport = require("passport");
const db = require("../models/database.js");
const bcrypt = require('bcryptjs');
const url = require('url');
const saltRounds = 10;


// Gets registration page
router.get("/register", function(req, res, next) {
  console.log("raya_query: " + req.query.classID);
  res.render("register", {
    title: "Form Validation",
    classID: req.query.classID   

  });
  req.session.errors = null;
});

// async function registerFunc(req, res, next) {
//     req.check('password', 'password not match').equals(req.body.passwordMatch);

//   var errors = req.validationErrors();
//   console.log("errors: "+errors);

//   if (errors) {

//   } else {
//     const { username, email, password , passwordMatch} = req.body;
//     User.checkValid(email).then(isValid => {
//       //if there is no similar user in the the user table--> insert the user
//       if (isValid) {
//         console.log("valid");

//         User.register(username, email, password).then(userID => {
//           req.login({ id: userID }, () => res.render("emojiSharing"));
//         });

//         //if there is similar user exists in the table --> show error
//       } else {
//         console.log("not valid");

//         res.render("errorPage", {
//           title: "Error : Similar user exists",

//         });
//       }
//     });
//   }
//   next();
// }


//first check if same classes_id && users_id is not exists then insert
async function insertToRegisteration(req, res, next) {

  let query = " INSERT INTO emoji_db.registerations (classes_id, users_id) VALUES ( " +req.body.classID+ ", "+req.userID+" )";
  await db.execute(query, (err, res) => {
    console.log("myQuery: "+query);
      if (err) throw err;
      next();
  });
}
async function getUserID(req, res, next) {

  let query = " SELECT * FROM emoji_db.users where email = '"+req.body.email+"'";
  await db.execute(query, (err, res) => {
      console.log(query); 
      if (err) throw err;
      
      req.userID = res[0].id;
      console.log(req.userID);    
      next();
  });
}
//check user is user is valid, no email like that is exists-> userValid = true/false
//if userValid == false -> pass error message to req.errorMessage
//if userValid ==true -> (add user to users table) (get the user number) (get classID) (add to registeration)
// Verifies that new user has filled in the signup form correctly and creates user
async function checkUserIsValid(req, res, next) {

  let query = " SELECT * FROM emoji_db.users where email = '"+req.body.email+"'";
  await db.execute(query, (err, res) => {
      console.log(query); 
      if (err) throw err;
      let userIsValid;
      let errorMsg;
      if(res.length > 0){
        console.log("res.length > 0");
        userIsValid = 0;
        errorMsg = 'the user exists';      
      }else{
        console.log("res.length == 0");
        userIsValid = 1;
      }  
      req.userIsValid = userIsValid; 
      req.errorMsg = errorMsg;  
      req.class_id = req.body.classID;   
      next();
  });
}

async function insertUser(req, res, next) {
    if(req.userIsValid === 1){
      const hash = bcrypt.hashSync(req.body.password, saltRounds);
      let query = " INSERT INTO emoji_db.users (full_name, email, password, isInstructor) VALUES ( '" +req.body.username+ "' , '"+ req.body.email +"' , '"+ hash +"', 0)";
      await db.execute(query, (err, res) => {
          console.log(query); 
          if (err) throw err;    
          next();
      });
    }else{
      next();
    }
}

async function getUserID(req, res, next) {

  let query = " SELECT * FROM emoji_db.users where email = '"+req.body.email+"'";
  await db.execute(query, (err, res) => {
      console.log(query); 
      if (err) throw err; 
      req.user_id = res[0].id; 
      next();
  });
}
async function checkRegisteration(req, res, next) {

  let query = " SELECT * FROM emoji_db.registerations where classes_id = "+req.class_id+" and users_id = "+req.user_id;
  await db.execute(query, (err, res) => {
      console.log(query); 
      if (err) throw err;
      let duplicateRegisteration; 
      if(res.length > 0){
        duplicateRegisteration = 1;
      }else{
        duplicateRegisteration = 0;
      } 
      req.duplicateRegisteration = duplicateRegisteration;
      next();     
  });
}

async function insertRegisteration(req, res, next) {
  if(req.duplicateRegisteration === 0){
      let query = " INSERT INTO emoji_db.registerations (classes_id, users_id, isInstructor) VALUES ( " +req.class_id+ " ," +req.user_id+ " , 0 )";
      await db.execute(query, (err, res) => {
          console.log(query); 
          if (err) throw err;
          let duplicateRegisteration; 
          if(res.length > 0){
            duplicateRegisteration = 1;
          }else{
            duplicateRegisteration = 0;
          } 
          req.duplicateRegisteration = duplicateRegisteration;
          next();     
      });
  }else{
    next();
  }
}

async function getRegisterationID(req, res, next) {

  let query = " SELECT * FROM emoji_db.registerations where classes_id = "+req.class_id+" and users_id = "+req.user_id;
  await db.execute(query, (err, res) => {
      console.log(query); 
      if (err) throw err;
      req.reg_id = res[0].id;
      next();     
  });
}

router.post("/register", checkUserIsValid, insertUser, getUserID, checkRegisteration, insertRegisteration, getRegisterationID, function(req, res, next) {
  console.log("req.userIsValid: "+req.userIsValid);
  console.log("req.errorMsg: "+req.errorMsg);
  console.log("req.class_id: "+req.class_id);
  console.log("req.user_id: "+req.user_id);
  req.login({ id: req.user_id }, () => res.redirect(url.format({
    pathname: "/sendEmoji",
    query: {
        "reg_id": req.reg_id
    }
  })));


});

//if login failed remove the Registrations added row
// Redirect for failed login
router.get("/login/failed", (req, res) => {

  console.log('login failed');
  res.render("login", {
    error_msg : 'login failed',
    isLoggedIn: req.isAuthenticated()
  });
});

// Get login page
router.get("/login", function(req, res) {
  res.render("login", {
    error_msg :'',
    title: "Login",
    classID: req.query.classID,
    isLoggedIn: req.isAuthenticated()
  });

});


// // Logs in user
// router.post("/login",
//   passport.authenticate("local", {
//     successRedirect: "/sendEmoji",
//     failureRedirect: "/login/failed",
//     failureFlash: false
//   })
// );

async function getRegistrationID_login(req, res, next) {

  let query = " SELECT * FROM emoji_db.registerations where classes_id = "+req.body.classID+" and users_id = "+req.user.id;
  await db.execute(query, (err, res) => {
      console.log(query); 
      if (err) throw err;
      req.reg_id = res[0].id;
      next();     
  });
}

// Logs in user
router.post("/login", passport.authenticate("local", {
      failureRedirect: "/fail",
      failureFlash: false,
    }), getRegistrationID_login, function(req, res) {
  // console.log("req.user.id: "+req.user.id);
  // console.log("req.query.classID: "+req.body.classID);

  res.redirect(url.format({
    pathname: "/sendEmoji",
    query: {
        "reg_id": req.reg_id,
    }
}));
});


// Logs out user
router.get("/logout", function(req, res) {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((id, done) => {
  done(null, id);
});


module.exports = router;