const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

require('./routes/route-config')(app);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Service is listening on port ${port}`);
});