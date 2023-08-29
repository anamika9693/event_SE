//Fuck Maity-Something his wife dont do-Rohan do
const express = require("express")
const https=require("https");
const app = express()
const path = require("path")
const hbs = require("hbs")
const moment = require('moment')
const fs = require('fs')
const event_controllers = require("../controllers/events.controller")
const login_controllers = require("../controllers/login.controller")
const registrations_controllers = require("../controllers/registrations.controller")
const notification_controllers = require("../controllers/notifications.controller")
const feedback_controllers = require("../controllers/feedback.controller")
const signup_collection = require("../models/signup.model")
const notification_collection = require("../models/notification.model")
const registration_collection = require("../models/registration.model")
const event_collection = require("../models/events.model")
const templates_path = path.join(__dirname, '../templates')
const session = require("express-session")
const MongoDbSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose')
const mongoURI = 'mongodb://127.0.0.1:27017/se_project'
const multer = require('multer')
const helmet=require("helmet");
let storage = multer.diskStorage({
  destination: 'public/images/',
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})
let upload = multer({
  storage: storage
})
mongoose.connect(mongoURI).then(() => {
  console.log("connection established");
})
const store = new MongoDbSession({
  uri: mongoURI,
  collection: "sessions",
})
app.use(session({
  secret: "this is a secret key",
  resave: false,
  saveUninitialized: false,
  store: store
}))
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(express.json())
app.set("view engine", "hbs")
app.set("views", templates_path)
app.use(express.urlencoded({ extended: false }))
app.use("/public", express.static("public"))
num_req = 1;
num_con = 1;
const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next()
  }
  else
    res.render("login",{check:0})
}
app.get("/", (req, res) => {
  if (req.session.isAuth) {
    async function login_2() {
      console.log("yo");
      console.log(req.session)
      const data = {
        email: req.session.user,
      }

      const check = await signup_collection.findOne({ email: data.email })
      const event_notif = await notification_collection.findOne({ email: data.email });
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
        if (event_notif.waitlist.length == 0) event_notif.waitlist = null;
      }
      res.render("landing_page", { event_data: event_notif, image: req.session.profile.profile_image })
    };
    login_2();
  }
  else
    res.render("login",{check:0})
})
app.get("/new_event", isAuth, async (req, res) => {
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
    if (event_notif.waitlist.length == 0) delete event_notif.waitlist;
  }
  res.render("create_event", { event_data: event_notif, image: req.session.profile.profile_image })
})
app.get("/private_registration", isAuth, (req, res) => {
  res.render("private_registration")
})


app.get("/find_event", isAuth, event_controllers.find_event)
app.get("/show_event", isAuth, event_controllers.show_event)
app.get("/show_registered_events", isAuth, event_controllers.show_registered_event)
app.post("/get_list", event_controllers.get_list)
app.post("/give_feedback", event_controllers.get_feedback)


app.post("/register", registrations_controllers.register)
app.post("/cancel_register", registrations_controllers.cancel_registration)
app.post("/waitlist", registrations_controllers.waitlist)
app.post("/edit_event", registrations_controllers.edit_event)
app.post("/edited_event", registrations_controllers.edited_event)
app.post("/delete_event", registrations_controllers.delete_event)

app.post("/signup", login_controllers.signup)
app.post("/profileUpdate", upload.single('file'), login_controllers.profileUpdate)
app.post("/new_event", upload.single('brochure'), event_controllers.create_event)
app.post("/login", login_controllers.login)
app.get("/reg-ticket", login_controllers.index)
app.get("/logout", login_controllers.logout)
app.get("/give_feedback_app", feedback_controllers.give_feedback_app)
app.post("/feedback_submitted", feedback_controllers.feedback_submitted)
app.post("/given_feedback", feedback_controllers.event_feedback_submitted)
app.post("/check_otp",login_controllers.check_otp)
app.post("/eventFeedback", feedback_controllers.seeEventFeedback);
app.get("/broadcast", login_controllers.broadcast)

app.get("/attendeecsv", async (req, res) => {
  let data = await registration_collection.findOne({ Event_ID: req.query.event });
  var new_data = [];
  data.registered = data.registered.slice(1);
  for (var k of data.registered) {
    var userData = await signup_collection.findOne({ email: k.email });
    new_data.push({ name: userData.name, email: userData.email, Organisation: userData.organisation });
  }
  function dataToCSV(dataList, headers) {
    var allObjects = [];
    allObjects.push(headers);
    dataList.forEach(function (object) {
      var arr = [];
      arr.push(object.name);
      arr.push(object.email);
      arr.push(object.Organisation);
      allObjects.push(arr)
    });
    var csvContent = "";
    allObjects.forEach(function (infoArray, index) {
      var dataString = infoArray.join(",");
      csvContent += index < allObjects.length ? dataString + "\n" : dataString;
    });
    return csvContent;
  }
  res.writeHead(200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename=*custom_name*.csv'
  });
  res.end(dataToCSV(new_data, ["name", "email", "organisation"]), "binary");
});

app.get("/profile", async (req, res) => {
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
    if (event_notif.waitlist.length == 0) delete event_notif.waitlist;
  }
  res.render('profile', { event_data: event_notif, image: req.session.profile.profile_image, user: req.session.profile });
})
app.get("/notif_clicked", notification_controllers.clicked_notif)
app.get("/waitlist_clicked", notification_controllers.waitlist_clicked)

// app.listen(3000, () => {
//   console.log("port connected");
// })
https.createServer({
  key:fs.readFileSync('key.pem'),
  cert:fs.readFileSync('cert.pem'),
},app).listen(3000,()=>{
  console.log(`listening now`);
})

hbs.handlebars.registerHelper('formatTime', function (date, format) {
  var mmnt = moment(date);
  return mmnt.format(format);
});

hbs.handlebars.registerHelper('array', function (elem) {
  return Array.isArray(elem);
});

hbs.handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

hbs.handlebars.registerHelper('notEmpty', function (arg1) {
  if (!arg1) return false;
  if (arg1.length) return true;
  return Object.keys(arg1).length != 0;
});
hbs.handlebars.registerHelper("when", function (operand_1, operator, operand_2, options) {
  var operators = {
    'eq': function (l, r) { return l == r; },
    'noteq': function (l, r) { return l != r; },
    'gt': function (l, r) { return Number(l) > Number(r); },
    'or': function (l, r) { return l || r; },
    'and': function (l, r) { return l && r; },
    '%': function (l, r) { return (l % r) === 0; }
  }
    , result = operators[operator](operand_1, operand_2);

  if (result) return options.fn(this);
  else return options.inverse(this);
});
hbs.handlebars.registerHelper('In', function (elem, list, options) {
  let email_array = list.map((elements) => (elements.email))
  if (email_array.indexOf(elem) > -1) {
    return options.fn(this);
  }
  return options.inverse(this);
});
hbs.handlebars.registerHelper('notIn', function (elem, list, options) {

  let email_array = list.map((elements) => (elements.email))
  if (email_array.indexOf(elem) > -1) {
    return options.inverse(this);
  }
  return options.fn(this);
});

hbs.handlebars.registerHelper('notPast', function (elem) {
  if (new Date(elem) < new Date()) return false;
  return true;
});