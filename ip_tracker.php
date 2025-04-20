<?php
class IPTracker {
    private $dataFile;
    private $limitMinutes;
    private $data;
    
    public function __construct($dataFile = 'ip_tracker_data.json', $limitMinutes = 10) {
        $this->dataFile = $dataFile;
        $this->limitMinutes = $limitMinutes;
        $this->loadData();
        $this->cleanupOldData();
    }
    
    private function loadData() {
        if (file_exists($this->dataFile)) {
            $content = file_get_contents($this->dataFile);
            $this->data = json_decode($content, true);
            
            if (!is_array($this->data)) {
                $this->data = [
                    'last_cleanup' => time(),
                    'ips' => []
                ];
            }
        } else {
            $this->data = [
                'last_cleanup' => time(),
                'ips' => []
            ];
        }
    }
    
    private function saveData() {
        file_put_contents($this->dataFile, json_encode($this->data, JSON_PRETTY_PRINT));
    }
    
    public function canSendNotification($ip) {
        $currentTime = time();
        
        if (!isset($this->data['ips'][$ip])) {
            $this->data['ips'][$ip] = $currentTime;
            $this->saveData();
            return true;
        }
        
        $lastTime = $this->data['ips'][$ip];
        $diffMinutes = ($currentTime - $lastTime) / 60;
        
        if ($diffMinutes >= $this->limitMinutes) {
            $this->data['ips'][$ip] = $currentTime;
            $this->saveData();
            return true;
        }
        
        return false;
    }
    
    private function cleanupOldData() {
        $currentTime = time();
        $lastCleanup = $this->data['last_cleanup'];
        
        $diffHours = ($currentTime - $lastCleanup) / 3600;
        
        if ($diffHours >= 24) {
            $this->data = [
                'last_cleanup' => $currentTime,
                'ips' => []
            ];
            $this->saveData();
            
            if (function_exists('error_log')) {
                error_log('IP tracker data reset at ' . date('Y-m-d H:i:s'));
            }
        } else {
            foreach ($this->data['ips'] as $ip => $time) {
                $diffHours = ($currentTime - $time) / 3600;
                if ($diffHours >= 24) {
                    unset($this->data['ips'][$ip]);
                }
            }
            $this->saveData();
        }
    }
    
    public function getRemainingMinutes($ip) {
        if (!isset($this->data['ips'][$ip])) {
            return 0;
        }
        
        $currentTime = time();
        $lastTime = $this->data['ips'][$ip];
        $diffMinutes = ($currentTime - $lastTime) / 60;
        
        if ($diffMinutes >= $this->limitMinutes) {
            return 0;
        }
        
        return ceil($this->limitMinutes - $diffMinutes);
    }
}