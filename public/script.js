const cards = document.querySelectorAll(".advertisement-card");
const toggle = document.querySelector('.icon-btn');
const navLinkBtn = document.querySelectorAll('.link-btn');

document.querySelector('.login-btn')?.addEventListener('click', () => {
    window.location.href = '/login/';
});

function updateHeaderOnScroll() {
    document.querySelector('.nav-bar')?.classList.toggle('scrolled', window.scrollY > 24);
}

window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });
updateHeaderOnScroll();

// Active nav link
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".link-btn");
    if (!btn) return;

    const section = document.getElementById(btn.dataset.section);
    if (!section) return;

    navLinkBtn.forEach(link => link.classList.remove("active"));
    btn.classList.add("active");
    section.scrollIntoView({ behavior: "smooth", block: "start" });
});



// Theme toggle
const themeKey = 'studentdesk-landing-theme';
const savedTheme = localStorage.getItem(themeKey);
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function setTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);

    const icon = toggle?.querySelector('i');
    if (icon) {
        icon.classList.toggle('ti-sun', !isDark);
        icon.classList.toggle('ti-moon', isDark);
    }

    toggle?.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle?.setAttribute('aria-pressed', String(isDark));
}

setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

toggle?.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem(themeKey, nextTheme);
    setTheme(nextTheme);
});






let current = 0;

function updateCarousel() {

    cards.forEach(card => {
        card.classList.remove(
            "left",
            "center",
            "right"
        );
    });

    let left = (current - 1 + cards.length) % cards.length;

    let center = current;

    let right = (current + 1) % cards.length;

    cards[left].classList.add("left");
    cards[center].classList.add("center");
    cards[right].classList.add("right");

}

updateCarousel();

setInterval(() => {
    current = (current + 1) % cards.length;
    updateCarousel();
}, 2500);

    
