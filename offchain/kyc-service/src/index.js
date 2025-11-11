const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const kycRouter = require('./routes/kyc');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', kycRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`KYC service listening on ${PORT}`));
