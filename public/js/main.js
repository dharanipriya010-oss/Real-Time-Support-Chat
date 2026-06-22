const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const msgInput = document.getElementById('msg');
const typingIndicator = document.getElementById('typing-indicator');

// Get username and room from URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const room = urlParams.get('room');

const socket = io();

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users details from server
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
    outputMessage(message);

    // Scroll down automatically
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Handle Displaying Typing Indicator
let typingTimeout;
msgInput.addEventListener('keypress', () => {
    socket.emit('typing', true);
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('typing', false);
    }, 1500); // stops indicator after 1.5s of no typing
});

socket.on('displayTyping', (data) => {
    if (data.isTyping) {
        typingIndicator.innerText = `${data.username} is typing...`;
    } else {
        typingIndicator.innerText = '';
    }
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get message text
    let msg = msgInput.value.trim();
    if (!msg) return false;

    // Emit message to server
    socket.emit('chatMessage', msg);
    socket.emit('typing', false); // Stop typing indicator immediately

    // Clear input
    msgInput.value = '';
    msgInput.focus();
});

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    
    // Check if the message is from current user to style it uniquely
    if (message.username === username) {
        div.classList.add('my-message');
    } else if(message.username === 'ChatBot') {
        div.classList.add('bot-message');
    }

    div.innerHTML = `
        <p class="meta">${message.username} <span>${message.time}</span></p>
        <p class="text">${message.text}</p>
    `;
    chatMessages.appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
        ${users.map(user => `<li><span class="user-status-dot"></span>${user.username}</li>`).join('')}
    `;
}