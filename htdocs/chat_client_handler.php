<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db_connect.php';

// Крайне вероятно стоит разрешить CORS:
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Headers: Content-Type");

function requireChatToken() {
    if (!isset($_COOKIE['chat_token'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Чат не инициализирован!'
        ]);
        exit;
    }
    return $_COOKIE['chat_token'];
}

function getChatByToken($mysqli, $chatToken) {
    $stmt = $mysqli->prepare("SELECT id FROM chats WHERE email_thread_token=? LIMIT 1");
    if (!$stmt) {
        return false;
    }
    $stmt->bind_param("s", $chatToken);
    $stmt->execute();
    $res = $stmt->get_result();
    return $res->fetch_assoc();
}

$action = isset($_GET['action']) ? $_GET['action'] : null;

switch ($action) {
    case 'start_chat':
        $userName  = isset($_POST['userName']) ? trim($_POST['userName']) : '';
        $userPhone = isset($_POST['userPhone']) ? trim($_POST['userPhone']) : '';
        $userEmail = isset($_POST['userEmail']) ? trim($_POST['userEmail']) : '';

        if (!$userName || !$userPhone) {
            echo json_encode([
                'success' => false,
                'message' => 'Необходимо указать имя и телефон!',
            ]);
            exit;
        }

        $userName = htmlspecialchars($userName, ENT_QUOTES, 'UTF-8');
        $userPhone = htmlspecialchars($userPhone, ENT_QUOTES, 'UTF-8');
        $userEmail = htmlspecialchars($userEmail, ENT_QUOTES, 'UTF-8');

        if (isset($_COOKIE['chat_token'])) {
            $existingToken = $_COOKIE['chat_token'];
            $stmt = $mysqli->prepare("SELECT id FROM chats WHERE email_thread_token=? AND status='open' LIMIT 1");
            $stmt->bind_param("s", $existingToken);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($row = $res->fetch_assoc()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Уже есть открытый чат',
                    'token'   => $existingToken,
                    'chat_id' => $row['id']
                ]);
                exit;
            }
        }

        $newToken = bin2hex(random_bytes(16));
        $stmt = $mysqli->prepare("INSERT INTO chats (user_name, user_phone, user_email, email_thread_token) VALUES (?, ?, ?, ?)");
                            // 🐍
        $stmt->bind_param("ssss", $userName, $userPhone, $userEmail, $newToken);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            $chatId = $stmt->insert_id;
            setcookie('chat_token', $newToken, time() + 3600 * 24 * 30, '/'); // сейчас тут 30 дней, можно поменять. 
                                                // также можно поставить samesite=lax для защиты от CSRF атак (и secure=true для https и httponly=true).
            echo json_encode([
                'success' => true,
                'message' => 'Чат создан',
                'token'   => $newToken,
                'chat_id' => $chatId
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Не удалось создать чат!',
            ]);
        }
        break;


    case 'send_message':
        $chatToken = requireChatToken();
        $messageText = isset($_POST['message']) ? trim($_POST['message']) : '';

        if (!$messageText) {
            echo json_encode(['success' => false, 'message' => 'Пустое сообщение недопустимо!']);
            exit;
        }

        $messageText = htmlspecialchars($messageText, ENT_QUOTES, 'UTF-8');

        $chat = getChatByToken($mysqli, $chatToken);
        if (!$chat) {
            echo json_encode(['success' => false, 'message' => 'Чат не найден!']);
            exit;
        }

        $chatId = $chat['id'];
        $sender_type = 'user';

        // Тут проверка частоты отправки сообщений
        $stmt = $mysqli->prepare("SELECT created_at FROM messages WHERE chat_id = ? AND sender_type='user' ORDER BY id DESC LIMIT 1");
        $stmt->bind_param("i", $chatId);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($row = $res->fetch_assoc()) {
            $lastTime = strtotime($row['created_at']);
            $now = time();
            if (($now - $lastTime) < 5) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Слишком частые сообщения!'
                ]);
                exit;
            }
        }

        $stmt = $mysqli->prepare("INSERT INTO messages (chat_id, sender_type, message_text) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $chatId, $sender_type, $messageText);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Сообщение отправлено']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ошибка при отправке сообщения!']);
        }
        break;


    case 'get_messages':
        $chatToken = requireChatToken();
        $chat = getChatByToken($mysqli, $chatToken);
        if (!$chat) {
            echo json_encode([
                'success' => false,
                'message' => 'Чат не найден!',
                'data' => []
            ]);
            exit;
        }

        $chatId = $chat['id'];
        $stmt = $mysqli->prepare("SELECT sender_type, message_text, created_at, id, is_read
                                  FROM messages
                                  WHERE chat_id = ?
                                  ORDER BY created_at ASC");
        $stmt->bind_param("i", $chatId);
        $stmt->execute();
        $res = $stmt->get_result();

        $messages = [];
        while ($row = $res->fetch_assoc()) {
            $messages[] = [
                'sender_type' => $row['sender_type'],
                'message_text'=> $row['message_text'],
                'created_at'  => $row['created_at'],
                'id'          => $row['id'],
                'is_read'     => $row['is_read']
            ];
        }

        echo json_encode(['success' => true, 'data' => $messages]);
        break;


    case 'read_messages':
        $chatToken = requireChatToken();
        $chat = getChatByToken($mysqli, $chatToken);
        if (!$chat) {
            echo json_encode(['success' => false, 'message' => 'Чат не найден!']);
            exit;
        }
        $chatId = $chat['id'];

        $stmt = $mysqli->prepare("UPDATE messages SET is_read=1 WHERE chat_id=? AND sender_type='admin' AND is_read=0");
        $stmt->bind_param("i", $chatId);
        $stmt->execute();

        echo json_encode(['success' => true, 'message' => 'Сообщения прочитаны']);
        break;


    case 'close_chat':
        $chatToken = requireChatToken();
        $stmt = $mysqli->prepare("UPDATE chats SET status='closed' WHERE email_thread_token=?");
        $stmt->bind_param("s", $chatToken);
        $stmt->execute();

        setcookie('chat_token', '', time() - 3600, '/');

        echo json_encode(['success' => true, 'message' => 'Чат успешно закрыт']);
        break;


    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие!']);
        break;
}