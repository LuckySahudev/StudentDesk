const cards = document.querySelectorAll(".advertisement-card");
const toggle = document.querySelector('.icon-btn');
const navLinkBtn = document.querySelectorAll('.link-btn');

// Active nav link
document.addEventListener("click", (e) => {
    const target = e.target;
    const btn = target.classList.contains("link-btn") ? target : target.parentElement;

    if (btn && btn.classList.contains("link-btn")) {
        navLinkBtn.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    }
});



// Theme toggle
toggle.addEventListener('click', () => {
    const icon = toggle.querySelector('i');
    let flag = icon.classList.contains('ti-sun');

    if (flag) icon.classList.replace('ti-sun', 'ti-moon');
    else icon.classList.replace('ti-moon', 'ti-sun');
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
}, 2000);

    