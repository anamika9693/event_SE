const event_collection = require("../models/events.model")
const registration_collection = require("../models/registration.model")
const notification_collection = require("../models/notification.model")
const individual_registration_collection = require("../models/individual_registrations.model")
const nodemailer = require("nodemailer");
const mailgen = require("mailgen");

async function edit_event(req, res) {
  let elem = await event_collection.findOne({ 'scope.code': req.body.Edit });
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
  res.render('edit_event', { data: elem, event_data: event_notif, image: req.session.profile.profile_image });
}
async function waitlist(req, res) {
  await notification_collection.findOneAndUpdate({ email: req.session.user }, { $push: { waitlist: req.body.register } }, { upsert: true })
  let find_elem = await event_collection.find({ "scope.scope": "public", "date.event_date": { $gte: new Date() } });
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
  res.render("find_event", { data: find_elem, event_data: event_notif, image: req.session.profile.profile_image });
}

async function delete_event(req, res) {
  await event_collection.findOneAndDelete({ 'scope.code': req.body.Edit });
  await registration_collection.findOneAndDelete({ Event_ID: req.body.Edit });
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
  res.render('index', { event_data: event_notif, image: req.session.profile.profile_image })
}

async function edited_event(req, res) {
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
  let data = {
    event_name: req.body.event_name,
    date: date,
    time: req.body.event_time,
    type: req.body.event_type,
    description: req.body.event_desc,
    fees: req.body.event_fee,
    contact: contact,
    requirements: requirements,
    'scope.scope': req.body.event_scope
  }
  if (req.body.notif) {
    var x = {
      time: (new Date()).toISOString(),
      name: data.event_name
    };
    var y = `Events.${req.body.code}`;
    var z = {};
    z.email = req.session.user;
    z[y] = x;
    var reg = await registration_collection.findOne({ 'Event_ID': req.body.code });
    for (var k of reg.registered) {
      if (!k.email) continue;
      await notification_collection.updateOne({ email: k.email }, { "$set": z }, { upsert: true });
    }
  }


  let elem = await event_collection.findOneAndUpdate({ 'scope.code': req.body.code }, { $set: data });
  const event_notif = await notification_collection.findOne({ email: req.session.user });
  res.render("index", { event_data: event_notif, image: req.session.profile.profile_image })
}


async function register(req, res) {
  try {
    cur_email = { email: req.session.user }
    cur_event = { events: req.body.register }
    let curr = registration_collection.findOne({ 'Event_ID': req.body.register });
    if (curr.total_registrations >= curr.max_limit) {
      res.render('try later');
      return;
    }
    await registration_collection.findOneAndUpdate({ 'Event_ID': req.body.register }, { $push: { registered: cur_email } })
    await individual_registration_collection.findOneAndUpdate({ 'Email': req.session.user }, { $push: { events: cur_event } }, { upsert: true })
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
        intro:"you have successfully registered",
      }
    }
    let mail=mail_generator.generate(response)
    let message={
      from:'prathambhatia8686@gmail.com',
      to:req.session.user,
      html:mail
    }
    transporter.sendMail(message);
    await event_collection.findOneAndUpdate({ 'scope.code': req.body.register }, { $inc: { 'total_registrations': 1 } })
      .then(() => { console.log('ok') })
      .catch(() => {
        console.log('ok')
      })
    await notification_collection.updateOne({ email: req.session.user }, { $pull: { waitlist: req.body.register } });
    let find_elem = await event_collection.find({ "scope.scope": "public", "date.event_date": { $gte: new Date() } });
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
    res.render("find_event", { data: find_elem, event_data: event_notif, image: req.session.profile.profile_image });
  }
  catch {
    res.send("wrong code");
  }
};
async function cancel_registration(req, res) {
  await individual_registration_collection.updateOne({ 'Email': req.session.user }, { $pull: { 'events': { 'events': req.body.cancel_register } } })
  await registration_collection.updateOne({ 'Event_ID': req.body.cancel_register }, { $pull: { 'registered': { 'email': req.session.user } } })
  await event_collection.findOneAndUpdate({ 'scope.code': req.body.cancel_register }, { $inc: { 'total_registrations': -1 } })
  let find_elem = await event_collection.find({ "scope.scope": "public", "date.event_date": { $gte: new Date() } });
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
  res.render("find_event", { data: find_elem, event_data: event_notif, image: req.session.profile.profile_image });
}
module.exports = {
  register,
  edit_event,
  edited_event, delete_event, waitlist,
  cancel_registration
}