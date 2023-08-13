const express = require('express');
const { chats } = require('./dummyData/data');
const dotenv = require('dotenv');
const connectDB = require('./config/db')
const color = require('colors');
const userRoute = require('./Routes/userRoute');
const chatRoutes = require('./Routes/chatRoute')
const {notFound, errorHandler} = require('./middleware/errorMiddlerware')
const messageRoute = require('./Routes/messageRoute')
const cors = require('cors')
const socketIo = require("socket.io");
const http = require("http");
const path = require("path")

const app = express();

app.use(express.json());
dotenv. config();
connectDB();

const PORT = process.env.PORT ||5000 ;


app.use('/api/user',userRoute)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoute)

// ---------------------------------

const __dirname1 = path.resolve();


if (process.env.NODE_ENV === "production") {
        
    app.use(express.static(path.join(__dirname1, "/frontend/build")));
    app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
    );
    
  } else {
    app.get("/", (req, res) => {
      res.send("API is running..");
    });
  }

//++++++++++++++++++++++++++++++++

app.use(errorHandler);
app.use(notFound);

app.use(cors());

const server = http.createServer(app);


const io = socketIo(server);

io.on("connection",(socket) =>{
console.log('connected to socket.io');
socket.on('setup', (userData) =>{
   socket.join(userData._id);
   socket.emit('connected');
})

socket.on('join chat', (room) =>{
    socket.join(room);
    console.log('User Joined Room: ' + room);
})

socket.on('typing', (room) =>{
    socket.in(room).emit("typing")

})
socket.on('stop typing', (room) =>{
    socket.in(room).emit("stop typing")

})

socket.on('new message', (newMessageRecieved) =>{

    var chat  = newMessageRecieved.chat;
    if(!chat.users) return console.log('chat.users not defined');

    chat.users.forEach(user => {
        if(user._id == newMessageRecieved.sender._id) return;
    
        if(socket.in(user._id).emit('message recieved', newMessageRecieved)){
            console.log("message recieved bro");
        }
    });
})


})

 server.listen('5000', console.log(`server is running on PORT ${PORT}`.yellow))