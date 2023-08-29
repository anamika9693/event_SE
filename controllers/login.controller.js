const signup_collection = require("../models/signup.model")
const otp_collection = require("../models/otp.model")
const notification_collection = require("../models/notification.model")
const event_collection = require("../models/events.model")
const nodemailer = require("nodemailer");
const mailgen = require("mailgen");
const otpGenerator = require('otp-generator');
const fs = require('fs')
const path = require("path")
const btoa = require("btoa")
const bcrypt = require("bcryptjs")
async function signup(req, res) {
  let hash_password = await bcrypt.hash(req.body.signup_password, 12);
  if (!req.file) {
    req.file = {};
    req.file.filename = "defaultUser.png";
  }
  let otp=+otpGenerator.generate(6, {lowerCaseAlphabets:false, upperCaseAlphabets: false, specialChars: false });;
  const data = {
    name: req.body.signup_name,
    email: req.body.signup_email,
    password: hash_password,
    contact: req.body.signup_contact,
    organisation: req.body.signup_organisation,
    profile_image: {
      data: btoa(fs.readFileSync(path.join(__dirname, '..', 'public', 'images', req.file.filename))),
      contentType: 'image/png'
    },
    authenticated:0,
    otp:otp
  }
  let temp1=await signup_collection.findOne({email:data.email});
  let temp2=await otp_collection.findOne({email:data.email});
  if(temp1||temp2)
  {
    res.render("login",{check:4});
  }
  else{
  await otp_collection.insertMany([data])
 
  let config={
    service:'gmail',
    auth:{
      user:'prathambhatia8686@gmail.com',
      pass:'oizeucizpyxufdnk'
    }
  }
  let transporter=nodemailer.createTransport(config);
  let mail_generator=new mailgen({
    theme:"default",
    product:{
      name: "Mailgen",
      link:'https://mailgen.js'
    }
  })
  let response={
    body:{
      intro:"O                                                                                                                                                                                                                                                                                                                                                                                                                                    TP for signup is "+otp,
    }
  }
  let mail=mail_generator.generate(response)
  let message={
    from:'prathambhatia8686@gmail.com',
    to:data.email,
    html:mail
  }
  transporter.sendMail(message);
  res.render("otp",{email:data.email});
  }

 
};

async function profileUpdate(req, res) {
  if (!req.file) {
    req.file = {};
    req.file.filename = "defaultUser.png";
  }

  const data = {
    name: req.body.name,
    email: req.session.user,
    contact: req.session.contact,
    profile_image: {
      data: btoa(fs.readFileSync(path.join(__dirname, '..', 'public', 'images', req.file.filename))),
      contentType: 'image/png'
    }
  }
  if (req.body.password) {
    let hash_password = await bcrypt.hash(req.body.password, 12);
    data.password = hash_password;
  }
  await signup_collection.findOneAndUpdate({ email: req.session.user }, { $set: data });
  req.session.profile = await signup_collection.findOne({ email: data.email });
  res.redirect('/');
};

async function profileUpdate(req, res) {
  if (!req.file) {
    req.file = {};
    req.file.filename = "defaultUser.png";
  }

  const data = {
    name: req.body.name,
    email: req.session.user,
    contact: req.session.contact,
    profile_image: {
      data: btoa(fs.readFileSync(path.join(__dirname, '..', 'public', 'images', req.file.filename))),
      contentType: 'image/png'
    }
  }
  if (req.body.password) {
    let hash_password = await bcrypt.hash(req.body.password, 12);
    data.password = hash_password;
  }
  await signup_collection.findOneAndUpdate({ email: req.session.user }, { $set: data });
  req.session.profile = await signup_collection.findOne({ email: data.email });
  res.redirect('/');
};

async function login(req, res) {
  const data = {
    email: req.body.login_email,
    password: req.body.login_password
  }
  try {
    const check = await signup_collection.findOne({ email: data.email })
    if(!check)
    res.render("login",{check:1});
    else{
    const event_notif = await notification_collection.findOne({ email: data.email });
    if(check.authenticated==0)
    res.render("login",{check:1})
    const isMatch = bcrypt.compareSync(data.password, check.password)
    if (isMatch) {
      req.session.isAuth = true;
      req.session.user = data.email;
      req.session.profile = check;
      if ((event_notif !== null) && event_notif.waitlist) {
        for (var k in event_notif.waitlist) {
          event_notif.waitlist[k] = await event_collection.findOne({ 'scope.code': event_notif.waitlist[k] })
            .then((temp1) => {
              if (temp1.max_limit > temp1.total_registrations) return { name: temp1.event_name, code: temp1.scope.code };
              else return 'null';
            })
        };
        event_notif.waitlist = event_notif.waitlist.filter((temp) => {
          return temp != 'null';
        })
      }
      res.render("index", { event_data: event_notif, image: req.session.profile.profile_image })
    }
    else
      res.render("login",{check:1})
  }
  }
  catch (err) {
    console.log(err);
    res.send("wrong credentials")
  }
};

async function index(req, res) {
  const event_notif = await notification_collection.findOne({ email: req.session.user });
  if ((event_notif !== null) && event_notif.waitlist) {
    for (var k in event_notif.waitlist) {
      event_notif.waitlist[k] = await event_collection.findOne({ 'scope.code': event_notif.waitlist[k] })
        .then((temp1) => {
          if (temp1.max_limit > temp1.total_registrations) return { name: temp1.event_name, code: temp1.scope.code };
          else return 'null';
        })
    };
    event_notif.waitlist = event_notif.waitlist.filter((temp) => {
      return temp != 'null';
    })
  }
  res.render("index", { event_data: event_notif, image: req.session.profile.profile_image })
};

async function broadcast(req, res) {
  const event_notif = await notification_collection.findOne({ email: req.session.user });
  if ((event_notif !== null) && event_notif.waitlist) {
    for (var k in event_notif.waitlist) {
      event_notif.waitlist[k] = await event_collection.findOne({ 'scope.code': event_notif.waitlist[k] })
        .then((temp1) => {
          if (temp1.max_limit > temp1.total_registrations) return { name: temp1.event_name, code: temp1.scope.code };
          else return 'null';
        })
    };
    event_notif.waitlist = event_notif.waitlist.filter((temp) => {
      return temp != 'null';
    })
  }
  res.render("Broadcast", { event_data: event_notif, image: req.session.profile.profile_image })
};

async function logout(req, res) {
  req.session.destroy((err) => {
    if (err)
      throw err;
    else
      res.render("login",{check:0});
  })
}
async function check_otp(req,res)
{
  let email=req.body.email;
  let user_otp=req.body.user_otp
 
  try {
    const check = await otp_collection.findOne({ email: email })
    // console.log(check.otp+" "+user_otp);
    if(check.otp==user_otp)
    {

      const data = {
        name: check.name,
        email: check.email,
        password: check.password,
        contact: check.contact,
        organisation: check.organisation,
        profile_image:check.profile_image,}
        await signup_collection.insertMany([data])
 
        await otp_collection.deleteMany({email:email});
        res.render("login",{check:2});
    }
    else{
      await otp_collection.deleteMany({email:email});
      res.render("login",{check:3});
    }
  }
  catch{
res.render("login",{check:3});
  }
}
module.exports = {
  signup,
  login,
  logout,
  index, profileUpdate,broadcast,check_otp,
}