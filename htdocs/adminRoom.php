<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Admin Chat Room</title>
    <link rel="stylesheet" href="adminStyles.css">
</head>
<body>
    <div class="admin-container">
        <div class="chats-list">
            <div class="chats-list-header">
                <h2>Поддержка (Админ)</h2>
                <div class="search-bar">
                    <input type="text" placeholder="Поиск чатов..." id="searchChats">
                </div>
            </div>
            
            <div class="chat-item active" data-chat-id="1">
                <div class="chat-item-top">
                    <span class="chat-user-name">Иван Петров</span>
                    <span class="chat-timestamp">11:24</span>
                </div>
                <div class="chat-last-message">
                    Здравствуйте, у меня вопрос по заказу...
                </div>
                <div class="chat-unread-count">2</div>
            </div>

            <div class="chat-item" data-chat-id="2">
                <div class="chat-item-top">
                    <span class="chat-user-name">Ольга</span>
                    <span class="chat-timestamp">10:15</span>
                </div>
                <div class="chat-last-message">
                    Спасибо большое за ответ!
                </div>
            </div>

            <div class="chat-item" data-chat-id="3">
                <div class="chat-item-top">
                    <span class="chat-user-name">Евгений</span>
                    <span class="chat-timestamp">Вчера</span>
                </div>
                <div class="chat-last-message">
                    (Нет новых сообщений)
                </div>
            </div>
        </div>

        <div class="chat-window">
            <div class="chat-header">
                <div class="chat-user-info">
                    <span class="chat-user-name">Иван Петров</span>
                    <span class="chat-user-email">ivan@example.com</span>
                </div>
                <div class="chat-header-actions">
                    <button id="endChatBtn">Завершить чат</button>
                </div>
            </div>

            <div class="chat-messages" id="chatMessages">
                <div class="message user">
                    <div class="message-info">
                        <span class="sender-name">Иван</span>
                        <span class="message-time">11:20</span>
                    </div>
                    <div class="message-text">
                        Здравствуйте! Подскажите, пожалуйста, когда будет отправлен заказ?
                    </div>
                </div>

                <div class="message admin">
                    <div class="message-info">
                        <span class="sender-name">Админ</span>
                        <span class="message-time">11:21</span>
                    </div>
                    <div class="message-text">
                        Добрый день, Иван! Ориентировочно сегодня после обеда.
                    </div>
                </div>

                <div class="message user">
                    <div class="message-info">
                        <span class="sender-name">Иван</span>
                        <span class="message-time">11:24</span>
                    </div>
                    <div class="message-text">
                        Отлично, спасибо. Ещё уточните, пожалуйста, трек-номер будет выслан на почту?
                    </div>
                </div>
            </div>

            <div class="chat-input-area">
                <textarea id="adminMessageInput" placeholder="Ваш ответ..."></textarea>
                <button id="sendMessageBtn">Отправить</button>
            </div>
        </div>
    </div>

    <script src="adminScript.js"></script>
</body>
</html>
