const dotenv = require('dotenv');
const Agenda = require('agenda');
const Monitors = require("./models/monitor");
const Monitor = require('ping-monitor');
const MonitorLogs = require("./models/monitorlogs")

dotenv.config();

const MONGO_URI = process.env.MONGO_URI

const agenda = new Agenda({
  db: {address: MONGO_URI, collection: 'jobs'}
}); 

agenda
 .on('ready', () => {
   console.log('Agenda started!')})
 .on('error', () => console.log('Agenda connection error!'));

agenda.define('send email report', {priority: 'high', concurrency: 10}, async(job, done) => {
  const PingData = await Monitors.findById(job.attrs.job_id)
  const myMonitor = await new Monitor(PingData.config)
  await myMonitor.on('up', function (res, state) {
    if(res.responseTime > 50){
      MonitorLogs.create({
        jobid: job.attrs.job_id,
        responseTime: res.responseTime,
        message: "website took greater than 50ms"
      })
    }
  });
  await myMonitor.on('down', function (res) {
    MonitorLogs.create({
      jobid: job.attrs.job_id,
      responseTime: -1,
      message: "Website Down"
    })
  });
  await myMonitor.on('stop', function (website) {
      console.log(website + ' monitor has stopped.');
  });
  await myMonitor.on('error', function (error) {
    MonitorLogs.create({
      jobid: job.attrs.job_id,
      responseTime: -1,
      message: error
    })
  })
  done()
});

module.exports = agenda;