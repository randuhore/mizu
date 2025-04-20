document.addEventListener('DOMContentLoaded', function() {
    if (!sessionStorage.getItem('visit_notification_sent')) {
        setTimeout(function() {
            sendVisitNotification();
        }, 3000);
    }
});

function sendVisitNotification() {
    const isRefresh = performance.navigation && performance.navigation.type === 1;
    
    const data = new FormData();
    data.append('page', window.location.href);
    data.append('referer', document.referrer);
    data.append('is_refresh', isRefresh ? 'true' : 'false');
    
    if (typeof (window.screen) === 'undefined' || typeof (navigator.language) === 'undefined') {
        console.log('Kemungkinan bukan browser lengkap, tidak mengirim notifikasi.');
        return;
    }
    
    data.append('screen_width', window.screen.width || 'Unknown');
    data.append('screen_height', window.screen.height || 'Unknown');
    data.append('language', navigator.language || 'Unknown');
    
    fetch('updated_telegram_notifier.php', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: data
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Notifikasi pengunjung berhasil dikirim');
            sessionStorage.setItem('visit_notification_sent', 'true');
        } else {
            console.log(data.message);
            
            if (data.remaining_minutes) {
                console.log(`Batasan waktu: ${data.remaining_minutes} menit tersisa.`);
            }
        }
    })
    .catch(error => {
        console.error('Error saat mengirim notifikasi:', error);
    });
}

function sendEventNotification(eventName, eventData = {}) {
    const data = new FormData();
    data.append('event_type', 'custom_event');
    data.append('event_name', eventName);
    data.append('page', window.location.href);
    
    if (Object.keys(eventData).length > 0) {
        data.append('event_data', JSON.stringify(eventData));
    }
    
    fetch('updated_telegram_notifier.php', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: data
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            console.log(`Notifikasi event ${eventName} berhasil dikirim`);
        } else {
            console.log(`Notifikasi event ${eventName}: ${result.message}`);
            
            if (result.remaining_minutes) {
                console.log(`Batasan waktu: ${result.remaining_minutes} menit tersisa.`);
            }
        }
    })
    .catch(error => {
        console.error(`Error saat mengirim notifikasi event ${eventName}:`, error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            sendEventNotification('cta_button_click', {
                button_text: this.textContent.trim(),
                button_url: this.getAttribute('href')
            });
        });
    });
});