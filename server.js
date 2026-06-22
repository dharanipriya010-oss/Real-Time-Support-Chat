const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatBot';
const users = {}; // Track active users: { socketId: { username, room } }

// Run when client connects
io.on('connection', (socket) => {
    
    // Handle user joining a room
    socket.on('joinRoom', ({ username, room }) => {
        users[socket.id] = { username, room };
        socket.join(room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to the Chat App!'));

        // Broadcast when a user connects (to everyone in the specific room except the user)
        socket.to(room).emit('message', formatMessage(botName, `${username} has joined the chat`));

        // Send users and room info to update the sidebar
        updateRoomUsers(room);
    });

    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        }
    });

    // Listen for typing event
    socket.on('typing', (isTyping) => {
        const user = users[socket.id];
        if (user) {
            socket.to(user.room).emit('displayTyping', { username: user.username, isTyping });
        }
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
            const room = user.room;
            delete users[socket.id];
            
            // Update sidebar for remaining users
            updateRoomUsers(room);
        }
    });
});

// Helper function to format messages
function formatMessage(username, text) {
    return {
        username,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
}

// Helper to update the user list in a room
function updateRoomUsers(room) {
    const roomUsers = Object.values(users).filter(user => user.room === room);
    io.to(room).emit('roomUsers', {
        room: room,
        users: roomUsers
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));