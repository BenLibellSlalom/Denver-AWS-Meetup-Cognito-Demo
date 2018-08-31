// server.js
// Builds out the node server and listens on port 8000

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const port = 8000;

app.use(bodyParser.json());

require("./routes/route-config") (app)
app.listen(port, () => {
	console.log('Service is listening on port ' + port);
});