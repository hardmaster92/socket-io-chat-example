const localStorageKey = 'chat_user';
const socket = io.connect('http://localhost:8080');
const textElement = document.getElementById('message-text');
const messagesList = document.getElementById('messages');
const usersList = document.getElementById('users');
const usersBtn = document.getElementById('users-btn');
const logoutBtn = document.getElementById('logout-btn');
let username;

textElement.addEventListener('keydown', (e) => {
  // submit message when Enter is pressed (Shift + Enter adds line break)
  if (e.key.toLowerCase() === 'enter' && !e.shiftKey) {
    onMessageSubmit(e);
  }
});

// show/hide users list on #users-btn click
usersBtn.addEventListener('click', () => {
  if (usersList.classList.contains('collapsed')) {
    usersList.classList.remove('collapsed');
    usersBtn.classList.remove('btn-outline-secondary');
    usersBtn.classList.remove('arrow-left');
    usersBtn.classList.add('btn-secondary');
    usersBtn.classList.add('arrow-right');
  } else {
    usersList.classList.add('collapsed');
    usersBtn.classList.remove('btn-secondary');
    usersBtn.classList.add('btn-outline-secondary');
    usersBtn.classList.remove('arrow-right');
    usersBtn.classList.add('arrow-left');
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(localStorageKey);
  socket.emit('logout', username);
  username = null;
  setTimeout(() => initializeUser(), 1000);
});

function initializeUser() {
  // try to obtain stored username
  username = localStorage.getItem(localStorageKey);
  // if stored username can't be found ask the user to enter their name
  while (!username) {
    username = prompt('Please, type your name.');
  }
  // store the username in the local storage and connect the user
  localStorage.setItem(localStorageKey, username);
  socket.emit('user_connected', username);
}

function onMessageSubmit(e) {
  e.preventDefault();

  if (textElement.value) {
    socket.emit('chat_message', textElement.value);
    textElement.value = '';
  }
  
  return false;
}

function updateUsersList(users) {
  usersList.innerHTML = '';
  for (const user of users) {
    const userItem = document.createElement('li');
    userItem.innerHTML = user;
    if (user === username) {
      userItem.innerHTML += ' (me)';
    }
    usersList.appendChild(userItem);
  }
}

// listen for chat messages and update the messages list
socket.on('chat_message', (msg) => {
  const listItem = document.createElement('li');
  listItem.innerHTML = msg.replace(/\n/g, '<br>');
  messagesList.appendChild(listItem);
});

// listen for user status changes and add info to the messages list
socket.on('user_status', (data) => {
  updateUsersList(data.users);

  if (!data.message) {
    return;
  }

  const listItem = document.createElement('li');
  listItem.className = 'alert alert-warning m-0';
  listItem.innerHTML = data.message;
  messagesList.appendChild(listItem);
});

initializeUser();