const userDropDown = document.querySelector("#user-icon")

// nav options (notification/messages)
userDropDown.addEventListener("click", () => {

    const navInfo = document.querySelector("#nav-info")

    if (navInfo.style.display === "none") {
        navInfo.style.display = "block"
    } else {
        navInfo.style.display = "none"
    }
})

// nav links
const logoDropDown = document.querySelector("#logo-icon")

logoDropDown.addEventListener("click", () => {

    const navLinks = document.querySelector("#nav-links")

    if (navLinks.style.display === "none") {
        navLinks.style.display = "block"
    } else {
        navLinks.style.display = "none"
    }
})

const hideNavIcons = document.querySelectorAll("#hide-nav")
const navbar = document.querySelector(".navbar")

hideNavIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        navbar.classList.toggle("hidden")
    })
})

function blink() {
    if (document.getElementsByClassName('txt').length) {
        document.getElementsByClassName('notification')[0].classList.add('extra_stuff');
    }
}

