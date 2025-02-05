document.addEventListener('DOMContentLoaded', () => {
  const openChatBtn = document.getElementById('openChatBtn');
  const chatContainer = document.getElementById('chatContainer');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const endChatBtn = document.getElementById('endChatBtn');
  const userForm = document.getElementById('userForm');
  const userName = document.getElementById('userName');
  const userPhone = document.getElementById('userPhone');
  const userEmail = document.getElementById('userEmail');
  const userNameError = document.getElementById('userNameError');
  const userPhoneError = document.getElementById('userPhoneError');
  const userEmailError = document.getElementById('userEmailError');
  const messagesWrapper = document.getElementById('messagesWrapper');
  const messagesDiv = document.getElementById('messages');
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const cooldownTimer = document.getElementById('cooldownTimer');
  const unreadBadge = document.getElementById('unread');
  const confirmationPanel = document.getElementById('confirmationPanel');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  let sendCooldown = false;
  let countdownInterval = null;
  let pollIntervalId = null;
  let chatIsOpen = false;

  let renderedMessageIds = new Set();

  openChatBtn.addEventListener('click', () => { chatContainer.classList.add('active'); unreadBadge.style.opacity = 0; readMessages(); });
  closeChatBtn.addEventListener('click', () => { chatContainer.classList.remove('active'); });

  initChat();

  async function initChat() {
    try {
      const response = await fetch('chat_client_handler.php?action=get_messages');
      const data = await response.json();
      if (data.success) {
        chatIsOpen = true;
        endChatBtn.style.display = 'inline-block';
        userForm.style.display = 'none';
        messagesWrapper.style.display = 'flex';
        renderMessages(data.data);
        startPolling();
      } else {
        chatIsOpen = false;
        endChatBtn.style.display = 'none';
        userForm.style.display = 'grid';
        messagesWrapper.style.display = 'none';
      }
    } catch (err) {
      console.error('(!) Ошибка при инициализации чата:', err);
    }
  }

  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetErrorStates();

    let isValid = true;
    if (!userName.value.trim()) {
      userNameError.textContent = 'Введите имя.';
      userNameError.style.display = 'block';
      userName.style.borderColor = '#e74c3c';
      isValid = false;
    }

    const phoneRegex = /^\+?[0-9\s\-()]{7,}$/;
    if (!phoneRegex.test(userPhone.value.trim())) {
      userPhoneError.textContent = 'Введите корректный номер.';
      userPhoneError.style.display = 'block';
      userPhone.style.borderColor = '#e74c3c';
      isValid = false;
    }

    if (userEmail.value.trim() !== '') {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(userEmail.value.trim())) {
        userEmailError.textContent = 'Некорректный email.';
        userEmailError.style.display = 'block';
        userEmail.style.borderColor = '#e74c3c';
        isValid = false;
      }
    }

    if (!isValid) return;

    const formData = new FormData();
    formData.append('userName', userName.value.trim());
    formData.append('userPhone', userPhone.value.trim());
    formData.append('userEmail', userEmail.value.trim());
    messagesDiv.innerHTML = '';

    try {
      const response = await fetch('chat_client_handler.php?action=start_chat', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        chatIsOpen = true;
        userForm.style.display = 'none';
        messagesWrapper.style.display = 'flex';
        endChatBtn.style.display = 'inline-block';
        loadMessages();
        startPolling();
      } else {
        alert(data.message || 'Ошибка при создании чата');
      }
    } catch (err) {
      console.error('Ошибка при создании чата:', err);
      alert('Ошибка при создании чата!');
    }
  });

  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sendCooldown) return;

    const text = messageInput.value.trim();
    if (!text) {
      messageInput.style.borderColor = '#e74c3c';
      return;
    }

    const formData = new FormData();
    formData.append('message', text);

    try {
      const response = await fetch('chat_client_handler.php?action=send_message', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        messageInput.value = '';
        messageInput.style.borderColor = '#e0e0e0';
        loadMessages();
        startCooldown();
      } else {
        alert(data.message || 'Не удалось отправить сообщение');
      }
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    }
  });

  async function loadMessages() {
    try {
      const response = await fetch('chat_client_handler.php?action=get_messages');
      const data = await response.json();
      if (data.success) {
        renderMessages(data.data);
      } else {
        console.log('Чат закрыт или не существует');
        stopPolling();
      }
    } catch (err) {
      console.error('Ошибка при получении сообщений:', err);
    }
  }

  async function readMessages() {
    try {
      const response = await fetch('chat_client_handler.php?action=read_messages');
      const data = await response.json();
      if (data.success) {
        unreadBadge.style.opacity = 0;
      } else {
        console.log('Чат закрыт или не существует');
        stopPolling();
      }
    } catch (err) {
      console.error('Ошибка при получении сообщений:', err);
    }
  }

  function renderMessages(messages) {
    let changed = false;
    for (const msg of messages) {
      if (!renderedMessageIds.has(msg.id)) {
        changed = true;
        appendMessage(msg);
        renderedMessageIds.add(msg.id);
      }
    }

    if (changed) {
      if (!chatContainer.classList.contains('active') && messages.some(msg => Number(msg.is_read) === 0 && msg.sender_type === 'admin'))
        unreadBadge.style.opacity = 1;
      else
        readMessages();
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  function appendMessage(msg) {
    const msgEl = document.createElement('div');
    msgEl.classList.add('message', msg.sender_type);
    const formattedTime = formatMessageTime(msg.created_at);

    msgEl.innerHTML = `
        <div class="message-text">${msg.message_text}</div>
        <div class="message-time">${formattedTime}</div>
      `;
    messagesDiv.appendChild(msgEl);
  }

  function formatMessageTime(dateStringUtc) {
    const [ymd, hms] = dateStringUtc.split(' ');
    const [year, month, day] = ymd.split('-').map(Number);
    const [hours, minutes, seconds = '0'] = hms.split(':').map(Number);

    const dateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    const localDay = String(dateObj.getDate()).padStart(2, '0');
    const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const localYear = dateObj.getFullYear();
    const localHour = String(dateObj.getHours()).padStart(2, '0');
    const localMinute = String(dateObj.getMinutes()).padStart(2, '0');

    return `${localDay}.${localMonth}.${localYear} ${localHour}:${localMinute}`;
  }

  function startPolling() {
    if (pollIntervalId) return;
    pollIntervalId = setInterval(() => {
      if (chatIsOpen) {
        loadMessages();
      }
    }, 5000); // опрос каждые 5 секунд (можно поменять если надо)
  }

  function stopPolling() {
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  }

  function startCooldown() {
    sendCooldown = true;
    const submitBtn = messageForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    let timeLeft = 5;
    cooldownTimer.style.display = 'block';
    cooldownTimer.textContent = `Подождите ${timeLeft} сек.`;

    countdownInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        cooldownTimer.textContent = `Подождите ${timeLeft} сек.`;
      } else {
        clearInterval(countdownInterval);
        countdownInterval = null;
        sendCooldown = false;
        submitBtn.disabled = false;
        cooldownTimer.style.display = 'none';
      }
    }, 1000);
  }

  endChatBtn.addEventListener('click', () => {
    if (!chatIsOpen) return;
    messagesWrapper.style.display = 'none';
    confirmationPanel.style.display = 'grid';
    endChatBtn.style.display = 'none';
  });

  confirmYes.addEventListener('click', async () => {
    try {
      const response = await fetch('chat_client_handler.php?action=close_chat');
      const data = await response.json();
      if (data.success) {
        chatIsOpen = false;
        stopPolling();
        messagesDiv.innerHTML = '';
        userForm.style.display = 'grid';
        messagesWrapper.style.display = 'none';
        confirmationPanel.style.display = 'none';
        endChatBtn.style.display = 'none';
        renderedMessageIds.clear();
      } else {
        alert('Ошибка: ' + data.message);
        messagesWrapper.style.display = 'flex';
        confirmationPanel.style.display = 'none';
        endChatBtn.style.display = 'inline-block';
      }
    } catch (err) {
      console.error('Ошибка при завершении чата:', err);
      messagesWrapper.style.display = 'flex';
      confirmationPanel.style.display = 'none';
      endChatBtn.style.display = 'inline-block';
    }
  });

  confirmNo.addEventListener('click', () => {
    confirmationPanel.style.display = 'none';
    messagesWrapper.style.display = 'flex';
    endChatBtn.style.display = 'inline-block';
  });

  function resetErrorStates() {
    [userName, userPhone, userEmail].forEach(input => {
      input.style.borderColor = '#e0e0e0';
    });
    [userNameError, userPhoneError, userEmailError].forEach(span => {
      span.textContent = '';
      span.style.display = 'none';
    });
  }
});