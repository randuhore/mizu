const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const menuOverlay = document.querySelector('.menu-overlay');
const navbar = document.querySelector('nav');

function toggleMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    
    if (hamburger.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

hamburger.addEventListener('click', toggleMenu);

menuOverlay.addEventListener('click', toggleMenu);

window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

document.addEventListener('mousemove', (e) => {
    const glows = document.querySelectorAll('.glow');
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    glows[0].style.transform = `translate(${mouseX * 0.03}px, ${mouseY * 0.03}px)`;
    glows[1].style.transform = `translate(${mouseX * -0.02}px, ${mouseY * 0.02}px)`;
    glows[2].style.transform = `translate(${mouseX * 0.01}px, ${mouseY * -0.01}px)`;
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (hamburger.classList.contains('active')) {
            toggleMenu();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const aboutSection = document.querySelector('.about');
    if (aboutSection && !aboutSection.id) {
        aboutSection.id = 'about';
    }
    
    const tokenomicsSection = document.querySelector('.tokenomics');
    if (tokenomicsSection && !tokenomicsSection.id) {
        tokenomicsSection.id = 'tokenomics';
    }
    
    const roadmapSection = document.querySelector('.roadmap');
    if (roadmapSection && !roadmapSection.id) {
        roadmapSection.id = 'roadmap';
    }
});

function copyContractAddress() {
  const address = "4Zu5b7EsYuxYTbcjKh275e6JYRhazqkC5NAfX2vCeQJh";
  navigator.clipboard.writeText(address).catch(() => {
    const el = document.createElement('textarea');
    el.value = address;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
  
  const tooltip = document.querySelector('.stat-value .tooltip');
  if (tooltip) {
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
    setTimeout(() => {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }, 2000);
  }
}