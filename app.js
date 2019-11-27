const express = require('express');
const app = express();


//Set the template engine ejs
app.set('view engine', 'ejs');

//Middlewares
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
})

server = app.listen(3000);

const io = require("socket.io")(server);

//Listen on every connection
io.on('connection', (socket) => {
    console.log('New user connected')

    //default username
    socket.username = "Anonymous"

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