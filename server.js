const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
app.use(express.json());

const edtRouter = require('./routes/edt/edt');
const ssoRouter = require('./routes/sso/o365/auth_callback');

app.use('/edt', edtRouter);
app.use('/auth', ssoRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));