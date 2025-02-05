document.addEventListener('DOMContentLoaded', () => {
    const chatItems = document.querySelectorAll('.chat-item');
    const chatMessages = document.getElementById('chatMessages');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const adminMessageInput = document.getElementById('adminMessageInput');
    const endChatBtn = document.getElementById('endChatBtn');

    chatItems.forEach((item) => {
        item.addEventListener('click', () => {
            chatItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const chatId = item.dataset.chatId;
            console.log('Выбран чат №' + chatId);
        });
    });

    sendMessageBtn.addEventListener('click', () => {
        const text = adminMessageInput.value.trim();
        if (!text) return;

        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'admin');
        msgDiv.innerHTML = `
            <div class="message-info">
                <span class="sender-name">Админ</span>
                <span class="message-time">11:59</span>
            </div>
            <div class="message-text">${text}</div>
        `;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        adminMessageInput.value = '';
    });

    endChatBtn.addEventListener('click', () => {
        if (confirm('Завершить текущий чат?')) {
            chatMessages.innerHTML = '';
        }
    });

    const searchInput = document.getElementById('searchChats');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        chatItems.forEach(item => {
            const userName = item.querySelector('.chat-user-name').textContent.toLowerCase();
            const lastMsg = item.querySelector('.chat-last-message').textContent.toLowerCase();
            if (userName.includes(query) || lastMsg.includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});
