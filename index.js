const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

// an object where we store the number open tabs per user
const userReferences = {};

app.get('/', function (req, res) {
  app.use(express.static(path.join(__dirname, '/public')));
  res.sendFile(__dirname  + '/index.html');
});

io.sockets.on('connection', function (socket) {
  function updateUsersStatus(messageType) {
    let message;

    switch (messageType) {
      case 'joined':
        message = `🟢 <i><strong>${socket.username}</strong> has joined the chat.</i>`;
        break;
      case 'left':
        message = `🔴 <i><strong>${socket.username}</strong> has left the chat.</i>`;
        break;
    }

    io.emit('user_status', { message, users: Object.keys(userReferences) });
  }

  socket.on('user_connected', function (username) {
    socket.username = username;

    // increment reference count for this user
    if (!userReferences[socket.username]) {
      userReferences[socket.username] = 0;
    }
    ++userReferences[socket.username];

    updateUsersStatus(userReferences[socket.username] > 1 ? null : 'joined');
  });

  socket.on('disconnect', function () {
    if (!socket.username) {
      return;
    }

    // decrement reference count for this user
    // and remove user if reference count hits zero
    if (userReferences.hasOwnProperty(socket.username)) {
      --userReferences[socket.username];
      if (userReferences[socket.username] === 0) {
        delete userReferences[socket.username];
      }
    }

    updateUsersStatus(userReferences.hasOwnProperty(socket.username) ? null : 'left');
  })

  socket.on('chat_message', function (message) {
    io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
  });

  socket.on('logout', function () {
    if (!socket.username) {
      return;
    }

    delete userReferences[socket.username];
    updateUsersStatus('left');
    return;
  });

});

const server = http.listen(8080, function () {
  console.log('listening on *:8080');
});