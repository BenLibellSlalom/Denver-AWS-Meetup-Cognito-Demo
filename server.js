// server.js

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const port = 8000;

app.use(bodyParser.json());

require("./routes/route-config") (app)
app.listen(port, () => {
	console.log('Service is listening on port ' + port);
});