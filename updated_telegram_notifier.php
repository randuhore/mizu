<?php
$config = include 'config.php';

require_once 'ip_tracker.php';

if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    http_response_code(403);
    die('Akses ditolak');
}

$visitorIP = isset($_SERVER['HTTP_CLIENT_IP']) 
    ? $_SERVER['HTTP_CLIENT_IP'] 
    : (isset($_SERVER['HTTP_X_FORWARDED_FOR']) 
        ? $_SERVER['HTTP_X_FORWARDED_FOR'] 
        : $_SERVER['REMOTE_ADDR']);

if (in_array($visitorIP, $config['exclude_ips'])) {
    echo json_encode([
        'success' => true,
        'message' => 'IP dikecualikan dari notifikasi'
    ]);
    exit;
}

$ipTracker = new IPTracker('ip_tracker_data.json', 10);

if (!$ipTracker->canSendNotification($visitorIP)) {
    $remainingMinutes = $ipTracker->getRemainingMinutes($visitorIP);
    echo json_encode([
        'success' => false,
        'message' => "IP dalam batasan waktu. Coba lagi dalam {$remainingMinutes} menit.",
        'remaining_minutes' => $remainingMinutes
    ]);
    exit;
}

$currentPage = isset($_POST['page']) ? $_POST['page'] : (isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : 'Unknown');

foreach ($config['exclude_paths'] as $path) {
    if (strpos($currentPage, $path) !== false) {
        echo json_encode([
            'success' => true,
            'message' => 'Path halaman dikecualikan dari notifikasi'
        ]);
        exit;
    }
}

$isRefresh = isset($_POST['is_refresh']) && $_POST['is_refresh'] === 'true';
if ($isRefresh && !$config['notify_on_refresh']) {
    echo json_encode([
        'success' => true,
        'message' => 'Refresh halaman dikecualikan dari notifikasi'
    ]);
    exit;
}

$visitorData = [
    'ip' => $visitorIP,
    'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Unknown',
    'page' => $currentPage,
    'time' => date('Y-m-d H:i:s'),
    'referer' => isset($_POST['referer']) && !empty($_POST['referer']) 
        ? $_POST['referer'] 
        : (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'Direct Visit')
];

$geoData = getGeoData($visitorIP);
if ($geoData) {
    $visitorData['country'] = $geoData['country'] ?? 'Unknown';
    $visitorData['city'] = $geoData['city'] ?? 'Unknown';
}

$deviceInfo = parseUserAgent($visitorData['user_agent']);
$visitorData['browser'] = $deviceInfo['browser'] ?? 'Unknown';
$visitorData['os'] = $deviceInfo['os'] ?? 'Unknown';
$visitorData['device'] = $deviceInfo['device'] ?? 'Unknown';

$message = "🔔 *New Visitor to Mizu AI Website!* 🔔\n\n";
$message .= "📅 *Time:* " . $visitorData['time'] . "\n";
$message .= "🌐 *IP Address:* " . $visitorData['ip'] . "\n";

if (isset($visitorData['country']) && isset($visitorData['city'])) {
    $message .= "📍 *Location:* " . $visitorData['city'] . ", " . $visitorData['country'] . "\n";
}

$message .= "💻 *Browser:* " . $visitorData['browser'] . "\n";
$message .= "🖥️ *OS:* " . $visitorData['os'] . "\n";
$message .= "📱 *Device:* " . $visitorData['device'] . "\n";
$message .= "🔗 *Page Visited:* " . $visitorData['page'] . "\n";
$message .= "➡️ *Referrer:* " . $visitorData['referer'] . "\n";

$url = "https://api.telegram.org/bot{$config['bot_token']}/sendMessage";
$params = [
    'chat_id' => $config['chat_id'],
    'text' => $message,
    'parse_mode' => 'Markdown'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$result = curl_exec($ch);
curl_close($ch);

$response = [
    'success' => false,
    'message' => 'Failed to send notification'
];

if ($result) {
    $decodedResult = json_decode($result, true);
    if ($decodedResult && isset($decodedResult['ok']) && $decodedResult['ok']) {
        $response = [
            'success' => true,
            'message' => 'Notification sent successfully'
        ];
    }
}

header('Content-Type: application/json');
echo json_encode($response);

function getGeoData($ip) {
    if ($ip == '127.0.0.1' || $ip == '::1') {
        return null;
    }
    
    try {
        $url = "https://ipinfo.io/{$ip}/json";
        $response = file_get_contents($url);
        if ($response) {
            return json_decode($response, true);
        }
    } catch (Exception $e) {
        return null;
    }
    
    return null;
}

function parseUserAgent($userAgent) {
    $result = [
        'browser' => 'Unknown',
        'os' => 'Unknown',
        'device' => 'Unknown'
    ];
    
    if (preg_match('/MSIE|Trident/i', $userAgent)) {
        $result['browser'] = 'Internet Explorer';
    } elseif (preg_match('/Firefox/i', $userAgent)) {
        $result['browser'] = 'Firefox';
    } elseif (preg_match('/Chrome/i', $userAgent) && !preg_match('/Edg/i', $userAgent)) {
        $result['browser'] = 'Chrome';
    } elseif (preg_match('/Safari/i', $userAgent) && !preg_match('/Chrome/i', $userAgent)) {
        $result['browser'] = 'Safari';
    } elseif (preg_match('/Edg/i', $userAgent)) {
        $result['browser'] = 'Edge';
    } elseif (preg_match('/Opera|OPR/i', $userAgent)) {
        $result['browser'] = 'Opera';
    }
    
    if (preg_match('/Windows/i', $userAgent)) {
        $result['os'] = 'Windows';
    } elseif (preg_match('/Macintosh|Mac OS X/i', $userAgent)) {
        $result['os'] = 'macOS';
    } elseif (preg_match('/Linux/i', $userAgent)) {
        $result['os'] = 'Linux';
    } elseif (preg_match('/Android/i', $userAgent)) {
        $result['os'] = 'Android';
    } elseif (preg_match('/iOS|iPhone|iPad|iPod/i', $userAgent)) {
        $result['os'] = 'iOS';
    }
    
    if (preg_match('/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i', $userAgent)) {
        if (preg_match('/tablet|iPad/i', $userAgent)) {
            $result['device'] = 'Tablet';
        } else {
            $result['device'] = 'Mobile';
        }
    } else {
        $result['device'] = 'Desktop';
    }
    
    return $result;
}