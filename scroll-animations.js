document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.about-content, .feature-card, .token-info, .allocation-chart, .timeline-item, .section-title, .about-header, .tokenomics-header, .roadmap-header');
    
    animatedElements.forEach(element => {
        element.classList.add('animate-hidden');
    });
    
    function checkScroll() {
        const triggerBottom = window.innerHeight * 0.85;
        
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.classList.add('animate-show');
            } else {
                element.classList.remove('animate-show');
            }
        });
    }
    
    checkScroll();
    
    window.addEventListener('scroll', checkScroll);
});

function animateCounters() {
    const stats = document.querySelectorAll('.stat-value');
    
    stats.forEach(stat => {
        if (isNaN(parseFloat(stat.textContent)) && !stat.textContent.includes('...')) {
            return;
        }
        
        const value = stat.innerHTML;
        const target = stat.textContent !== 'Solana' ? parseFloat(stat.innerText.replace(/,/g, '')) : stat.innerText;
        
        if (isNaN(target)) {
            return;
        }
        
        stat.setAttribute('data-target', target);
        stat.innerHTML = '0';
        
        const duration = 2000;
        const step = 30;
        const numberOfSteps = duration / step;
        let currentStep = 0;
        
        function updateCounter() {
            currentStep++;
            const progress = currentStep / numberOfSteps;
            let currentCount = Math.round(target * progress);
            
            if (target > 10000) {
                stat.innerHTML = currentCount.toLocaleString();
            } else {
                stat.innerHTML = currentCount;
            }
            
            if (currentStep < numberOfSteps) {
                requestAnimationFrame(updateCounter);
            } else {
                stat.innerHTML = value;
            }
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, {threshold: 0.5});
        
        observer.observe(stat);
    });
}

function animateTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(50px)';
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        item.style.transition = 'all 0.6s ease-out';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0px)';
                    }, index * 200);
                    observer.unobserve(entry.target);
                }
            });
        }, {threshold: 0.2});
        
        observer.observe(item);
    });
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        animateCounters();
        animateTimeline();
        setupSmoothScrolling();
    }, 500);
});