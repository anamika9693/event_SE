const event_collection = require("../models/events.model")
const registration_collection = require("../models/registration.model")
const individual_registration_collection = require("../models/individual_registrations.model")
const feedback_collection = require('../models/feedbacks.model')
const signup = require("../models/signup.model")
const fs = require('fs')
const path = require("path")
const btoa = require("btoa")
const notification_collection = require("../models/notification.model")
const { isModuleNamespaceObject } = require("util/types")
async function create_event(req, res) {
  let cur_status = ""
  let reg_Date = new Date(req.body.registration_date)
  let dates = new Date();
  if (dates > reg_Date)
    reg_Date = req.body.event_date
  const date = {
    event_date: req.body.event_date,
    registration: reg_Date
  };
  let contact = req.body.con_control;
  let requirements = req.body.req_control;
  let scope = {
    scope: req.body.event_scope,
    code: "PUBLIC"
  }
  if (!req.file) {
    req.file = {};
    req.file.filename = 'event.png';
  }
  let data = {
    email: req.session.user,
    event_name: req.body.event_name,
    date: date,
    time: req.body.event_time,
    type: req.body.event_type,
    description: req.body.event_desc,
    fees: req.body.event_fee,
    contact: contact,
    requirements: requirements,
    scope: scope,
    max_limit: req.body.max_participants,
    event_registrations: 0,
    image: {
      data: btoa(fs.readFileSync(path.join(__dirname, '..', 'public', 'images', req.file.filename))),
      contentType: 'image/png'
    }
  }
  var id = require("crypto").randomBytes(64).toString('hex');
  let find_code = await event_collection.find({ "scope.code": id }).count();
  while (find_code > 0) {
    id = require("crypto").randomBytes(64).toString('hex');
    find_code = await event_collection.find({ "scope.code": id }).count();
  }
  data.scope.code = id;

  await event_collection.insertMany([data])
  let registartion_data = {
    Event_ID: id,
    registered:
    {

    }
  }
  await registration_collection.insertMany([registartion_data]);
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
  res.render("index", { event_data: event_notif, image: req.session.profile.profile_image })
};



async function show_event(req, res) {
  let find_elem = await event_collection.find({ email: req.session.user });
  let cur_date = new Date();
  cur_date.setHours(0, 0, 0, 0)
  for (var i = 0; i < find_elem.length; i++) {
    let req_date = new Date(find_elem[i].date.event_date)
    req_date.setHours(0, 0, 0, 0)
    if (req_date > cur_date)
      find_elem[i].status = "upcoming"
    else if (req_date < cur_date)
      find_elem[i].status = "expired"
    else
      find_elem[i].status = "today"
  }
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
  res.render("show_events", { data: find_elem, event_data: event_notif, image: req.session.profile.profile_image })
};
async function find_event(req, res) {
  let find_elem = await event_collection.find({ "scope.scope": "public", "date.event_date": { $gte: new Date() } });
  let cur_date = new Date();
  cur_date.setHours(0, 0, 0, 0)
  for (var i = 0; i < find_elem.length; i++) {
    var element = find_elem[i];
    let req_date = new Date(element.date.event_date)
    req_date.setHours(0, 0, 0, 0)
    if (req_date > cur_date)
      element.status = "upcoming"
    else if (req_date < cur_date)
      element.status = "expired"
    else
      element.status = "today"
  }
  let cur_elem = await event_collection.findOne({ 'scope.code': req.query.ID });
  // var registered = {};
  // registered[req.session.user] = true;
  // var Event_ID = req.query.ID
  // var temp1 = {
  //   Event_ID: Event_ID,
  //   registered: registered
  // };
  // let reg = await registration_collection.find(temp1).count();
  // if (reg) cur_elem[0].registered = true;
  if (!cur_elem) {
    cur_elem = [find_elem[0]][0];
  }
  let reg_list = await registration_collection.find({ 'Event_ID': cur_elem.scope.code });
  if (!cur_elem.requirements) cur_elem.requirements = 'No Requirements';
  var temp_Date = new Date(cur_elem.date.event_date); temp_Date.setHours(0, 0, 0, 0);
  if (temp_Date < cur_date) {
    let given = await feedback_collection.findOne({ Event_ID: req.query.ID, "feedback.email": { $in: [req.session.user] } });
    if (given) find_elem.given = true;
  }
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
  res.render("find_event", { data: find_elem, event_data: cur_elem, cur_email: req.session.user, registered: reg_list[0].registered, event_datas: event_notif, image: req.session.profile.profile_image });
}
;



async function get_list(req, res) {
  let attendee = await registration_collection.findOne({ 'Event_ID': req.body.attendee });
  var x = [];
  for (var k = 1; k < attendee.registered.length; k++) {
    var temp2 = await signup.findOne({ 'email': attendee.registered[k].email });
    x.push(temp2);
  }
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
  res.render('get_list', {
    attendee: x.map((temp) => {
      var temp_child = {};
      temp_child.name = temp.name;
      temp_child.email = temp.email;
      temp_child.organisation = temp.organisation;
      return temp_child;
    }),
    event: req.body.attendee,
    event_data: event_notif, image: req.session.profile.profile_image
  });
}

async function get_feedback(req, res) {
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
  res.render('give_event_feedback', { email: req.session.user, event: req.body.event, event_data: event_notif, image: req.session.profile.profile_image });
}




async function show_registered_event(req, res) {

  let ids = await individual_registration_collection.findOne({ 'Email': req.session.user })
  if (!ids) {
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
    res.render("show_registered_events", { event_data: event_notif, image: req.session.profile.profile_image });
  }
  else {
    ids = ids.events;

    ids = ids.map((elem) => elem.events);
    var find_elem = await event_collection.find({ "scope.code": { $in: ids } });
    let cur_date = new Date();
    cur_date.setHours(0, 0, 0, 0)
    for (var i = 0; i < find_elem.length; i++) {
      let req_date = new Date(find_elem[i].date.event_date)
      req_date.setHours(0, 0, 0, 0)
      if (req_date > cur_date)
        find_elem[i].status = "upcoming"
      else if (req_date < cur_date)
        find_elem[i].status = "expired"
      else
        find_elem[i].status = "today"
    }
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
    res.render("show_registered_events", { data: find_elem, event_data: event_notif, image: req.session.profile.profile_image })
  }
};
module.exports = {
  create_event,
  show_event,
  show_registered_event,
  find_event,
  get_list, get_feedback
}