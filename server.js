import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const rpcUrl = 'http://127.0.0.1:8332';
const rpcAuth = {
  username: 'username',
  password: 'password',
};

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

// Start the server
const PORT = 8334;
app.listen(PORT, () => {
  console.log(`Node.js RPC server running on https://localhost:${PORT}`);
});
