const express = require('express');
const app = express();
const Joi = require('joi');
const exphbs = require('express-handlebars');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const db = require('./mysqlservices');
const path = require('path');

//View Engine Setup
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars')

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//static folder for CSS
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/login', function (req, res) {
    console.log("Log In");
    res.render('login', { layout: false });
});
app.post('/login', function (req, res) {
    console.log(req.body);
    const schema = Joi.object().keys({
        id: Joi.string().trim().email().required(),
        password: Joi.string().min(5).max(12).required()
    });
    Joi.validate(req.body, schema, (err, x) => {
        console.log(err);
        if (err) {
            return res.send("Validation Error");
        }
        let sqlQuery = 'select * from user_cred where email = \'' + req.body.id + '\'';
        console.log(sqlQuery);
        db.query(sqlQuery, (err, rows) => {
            if (err) {
                return res.send("Some Error Occured!");
            }
            if (rows.length > 0) {
                if (rows[0].password != req.body.password) {
                    return res.send("Password Not Matched");
                }
                res.render('index', { layout: false });
            }
            else {
                res.send("Email Not Registered");
            }
        });
    });
});


app.get('/signup', function (req, res) {
    res.render('signup', { layout: false });
});

app.post('/signup', function (req, res) {
    console.log("Received request data - ", req.body);
    const schema2 = Joi.object().keys({
        firstName: Joi.string().regex(/^[a-z ,.'-]+$/i).required(),
        lastName: Joi.string().regex(/^[a-z ,.'-]+$/i).required(),
        id: Joi.string().trim().email().required(),
        password: Joi.string().min(5).max(12).required()
    });
    Joi.validate(req.body, schema2, (err, x) => {
        console.log(err);
        if (err) {
            return res.send("Validation Error");
        }
        // (first_name, last_name, email, password)
        let sqlQuery = 'INSERT INTO user_cred  VALUES(\'' + req.body.firstName.toString() + '\' , \'' + req.body.lastName.toString() + '\', \'' + req.body.id.toString() + '\', \'' + req.body.password.toString() + '\' )';

        console.log(sqlQuery);

        db.query(sqlQuery, (err, rows) => {
            if (err) {
                console.log(err);
                return res.send("Some Error Occured!");
            }
            res.send('Sign Up Successfull...')
        });
    });
});

server = app.listen(3001);
console.log("Server Listening at 3001");

const io = require("socket.io")(server);

//Listen on every connection
io.on('connection', (socket) => {
    console.log('New user connected')
    
    //let f_name = 'select first_name from user_cred where email = \'' + req.body.id + '\'';

    //default username
    socket.username = "Annonymous";

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username
    })
    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', { message: data.message, username: socket.username });
    })

    //listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', { username: socket.username })
    })
})
