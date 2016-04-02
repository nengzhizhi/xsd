var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
	console.log(numCPUs);
	cluster.fork('./cluster.js');
}