#!/usr/bin/env node
const os = require('os');
const interfaces = os.networkInterfaces();

function getLocalIP() {
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

console.log(getLocalIP());
