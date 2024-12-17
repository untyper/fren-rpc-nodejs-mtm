// Copyright (c) [2024] [Jovan J. E. Odassius]
//
// License: MIT (See the LICENSE file in the root directory)
// Github: https://github.com/untyper/<INCOMING>

import express from 'express';
import axios from 'axios';
import cors from 'cors';
import https from 'https';
import tls from 'tls';
// import fs from "fs";
import { readFile } from 'fs/promises';
import { URL } from 'url';

const config = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'));

const rpcUrl = `http://127.0.0.1:${config.rpcPort}`;
const rpcAuth = {
  username: config.rpcUsername,
  password: config.rpcPassword,
};

const PORT = 443; // This server's port, HTTPS
const app = express();

// Function to load SSL certificates
async function loadCertificates() {
  let key, cert;

  try {
    key = await readFile(`/etc/letsencrypt/live/${config.domain}/privkey.pem`);
    cert = await readFile(`/etc/letsencrypt/live/${config.domain}/fullchain.pem`);
  } catch (err) {
    console.error(`Something went wrong trying to load Let's Encrypt SSL certificates.`, err);
    return;
  }

  return { key, cert };
}

// Load certificates and create a secure context
let sslOptions = await loadCertificates();
let secureContext =  tls.createSecureContext(sslOptions);
  
// Periodically reload certificates and update the secure context
setInterval(async () => {
  try {
    sslOptions = await loadCertificates();
    secureContext = tls.createSecureContext(sslOptions);
    console.log('Secure context updated successfully.');
  } catch (err) {
    console.error('Error updating SSL certificates:', err);
  }
}, 60 * 60 * 1000); // Reload every hour
  
// HTTPS server with SNICallback to use the updated secure context
const server = https.createServer({
  SNICallback: (serverName, callback) => {
  callback(null, secureContext);
  },
  ...sslOptions, // Initial certificates
}, app);

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// // Middleware for manual preflight handling (optional for demonstration)
// app.use((req, res, next) => {
//   if (req.method === 'OPTIONS') {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     return res.sendStatus(204);
//   }
//   next();
// });

// RPC Proxy Endpoint
app.post('/', async (req, res) => {
  console.log(req.body)
  try {
    const response = await axios.post(rpcUrl, req.body, {
      auth: rpcAuth,
    });
    // console.log(response);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the HTTPS server
server.listen(PORT, () => {
  console.log(`Node.js RPC server running on https://localhost:${PORT}`);
});
