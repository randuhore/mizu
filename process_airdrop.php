<?php
header('Content-Type: application/json');

$telegramBotToken = '8050917903:AAGvqzq6P-2y4nTYfAGdtXx6xg6eEBS-G8I';
$telegramChatId = '7343227152';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$twitterUsername = filter_input(INPUT_POST, 'twitterUsername', FILTER_SANITIZE_STRING);
$telegramUsername = filter_input(INPUT_POST, 'telegramUsername', FILTER_SANITIZE_STRING);
$solanaAddress = filter_input(INPUT_POST, 'solanaAddress', FILTER_SANITIZE_STRING);
$completedTasks = json_decode($_POST['completedTasks'] ?? '{}', true);

if (empty($twitterUsername) || empty($telegramUsername) || empty($solanaAddress)) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

if (strlen($solanaAddress) !== 44 && strlen($solanaAddress) !== 43) {
    echo json_encode(['success' => false, 'message' => 'Invalid Solana wallet address']);
    exit;
}

$allTasksCompleted = true;
foreach ($completedTasks as $taskCompleted) {
    if (!$taskCompleted) {
        $allTasksCompleted = false;
        break;
    }
}

if (!$allTasksCompleted) {
    echo json_encode(['success' => false, 'message' => 'Please complete all tasks before submitting']);
    exit;
}

$message = "🎉 New Mizu AI Airdrop Participant 🎉\n\n";
$message .= "Twitter: @{$twitterUsername}\n";
$message .= "Telegram: @{$telegramUsername}\n";
$message .= "Solana Address: {$solanaAddress}\n\n";
$message .= "Submitted: " . date('Y-m-d H:i:s');

$telegramApiUrl = "https://api.telegram.org/bot{$telegramBotToken}/sendMessage";
$telegramData = [
    'chat_id' => $telegramChatId,
    'text' => $message,
    'parse_mode' => 'HTML'
];

$ch = curl_init($telegramApiUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $telegramData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$telegramResponse = curl_exec($ch);
$telegramSuccess = false;

if (curl_errno($ch)) {
    error_log('Telegram API Error: ' . curl_error($ch));
} else {
    $responseData = json_decode($telegramResponse, true);
    $telegramSuccess = $responseData['ok'] ?? false;
}
curl_close($ch);

$logEntry = [
    'timestamp' => date('Y-m-d H:i:s'),
    'twitter' => $twitterUsername,
    'telegram' => $telegramUsername,
    'solana_address' => $solanaAddress,
    'ip_address' => $_SERVER['REMOTE_ADDR'],
    'telegram_sent' => $telegramSuccess ? 'yes' : 'no'
];

$logFile = fopen('airdrop_submissions.csv', 'a');
if ($logFile) {
    if (filesize('airdrop_submissions.csv') === 0) {
        fputcsv($logFile, array_keys($logEntry));
    }
    fputcsv($logFile, $logEntry);
    fclose($logFile);
}

echo json_encode([
    'success' => true,
    'message' => 'Airdrop registration successful! You will receive your tokens after the campaign ends.'
]);
?>