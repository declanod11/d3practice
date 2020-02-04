// A2Z F16
// Daniel Shiffman
// http://shiffman.net/a2z
// https://github.com/shiffman/A2Z-F16


// Using express: http://expressjs.com/
var express = require('express');
// Create the app
var app = express();
var port = 3000;

// Set up the server
// process.env.PORT is related to deploying on heroku
var server = app.listen(port, listen);

app.use(express.static('public'));

// app.get('/', (req, res) => {
//     res.send('Get response');
// });

// This call back just tells us that the server has started
function listen() {
  console.log('Listening on port '+port+'!');
}



// Set the route for the root directory
// app.get('/', hello);
// app.get("/", (req, res) => {
//     // res.sendFile(__dirname + '/public/home.html');
//     app.use('/public', express.static(__dirname + '/public'));
// });

// // // This is what happens when any user requests '/'
// function hello(req, res) {
//   // Just send back "Hello World!"
//   // Later we'll see how we might send back JSON
//   res.send('Hello World!');
// }