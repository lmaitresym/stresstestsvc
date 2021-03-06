const stresscpu = require("./stresscpu");
const stressmem = require("./stressmem");
const express = require('express');
const package_info = require('./package.json');
const sendtelegraf = require('./sendtelegraf.js');
const appmetrics = require('appmetrics');

const app = express();
const monitoring = appmetrics.monitor();

const app_version = package_info.version;
let request_nb=0;
let postData;

// ----------------------------------------------------------------------------
// METRICS LISTENERS
monitoring.on('cpu', (cpu) => {
  postData = `stress_app_cpu_percentage,host=${process.env.HOSTNAME} process=${cpu.process},system=${cpu.system} ${cpu.time}`;
  new sendtelegraf(postData);
});

monitoring.on('memory', (memory) => {
  postData = `stress_app_memory,host=${process.env.HOSTNAME} used=${memory.physical_used},free=${memory.physical_free} ${memory.time}`;
  new sendtelegraf(postData);
});

monitoring.on('app_version', (version) => {
  postData = `stress_app_version,host=${process.env.HOSTNAME} version=\"${version.value}\" ${version.time}`;
  new sendtelegraf(postData);
});

monitoring.on('requests', (requests) => {
  postData = `stress_app_requests,host=${process.env.HOSTNAME} requests=\"${requests.value}\" ${requests.time}`;
  new sendtelegraf(postData);
});
// ----------------------------------------------------------------------------

app.get('/', function (req, res) {
  res.send('Welcome');
})

app.get('/work/:timeLoad', function (req, res) {
  let timeLoad= req.params.timeLoad;
  new stresscpu(timeLoad); 
  request_nb+=1;
  res.send(app_version);
})

app.get('/wait/:waitDuration', function (req, res) {
  let waitDuration= req.params.waitDuration;
  new stresscpu(waitDuration);
  request_nb+=1;
  res.send(app_version);
})

app.get('/mem/:bytesLoad', function (req, res) {
  let bytesLoad= req.params.bytesLoad;
  new stressmem(bytesLoad);
  request_nb+=1;
  res.send(app_version);
}) 


setInterval(() => {
  appmetrics.emit('app_version', {time: Date.now(), value: app_version});
  appmetrics.emit('requests', {time: Date.now(), value: request_nb});
}, 1000);


const server=app.listen(3100);
server.timeout= 1000;
