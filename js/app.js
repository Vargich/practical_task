window.onload = function () {
  document.getElementById("phone").value = "";
};
const menu = document.querySelector("#mobile-menu");
const menuLinks = document.querySelector(".navbar__menu");
const navLogo = document.querySelector("#navbar__logo");
// const navbar = document.getElementById('navbar');
const navbar = document.querySelector(".navbar");
const navbar__container = document.getElementById("navbar__container");

// Display Mobile Menu
const mobileMenu = () => {
  document.querySelector("body").classList.toggle("active");
  document.querySelector("#telInfo").classList.toggle("active");
  menu.classList.toggle("is-active");
  menuLinks.classList.toggle("active");
  // if(element.style.backgroundColor=='white')
  //   element.style.backgroundColor='transparent';
  // else
  //   element.style.backgroundColor='white';
  navbar.classList.remove("background-glass");
  navbar.classList.toggle("background-white");
};

menu.addEventListener("click", mobileMenu);

// Show active menu when scrolling
// const highlightMenu = () => {
//   const elem = document.querySelector('.highlight');
//   const homeMenu = document.querySelector('#home-page');
//   const aboutMenu = document.querySelector('#about-page');
//   const servicesMenu = document.querySelector('#services-page');
//   let scrollPos = window.scrollY;
//   //navLogo.innerHTML=scrollPos;
//    navLogo.textContent=scrollPos;
//   if(window.innerWidth > 960 && scrollPos < 800)
//   {
//     navbar.classList.remove('background-glass');
//     homeMenu.classList.remove('highlight');
//     return
//   }
//   // adds 'highlight' class to my menu items
//   if (window.innerWidth > 960 && scrollPos < 1750) {
//     homeMenu.classList.add('highlight');
//     navbar.classList.add('background-glass');
//     aboutMenu.classList.remove('highlight');
//     return;
//   } else if (window.innerWidth > 960 && scrollPos < 3500) {
//     // alert(scrollPos);
//     //element.classList.add('background-white');
//     aboutMenu.classList.add('highlight');
//     homeMenu.classList.remove('highlight');
//     servicesMenu.classList.remove('highlight');
//     return;
//   } else if (window.innerWidth > 960 && scrollPos < 4500) {
//     //element.classList.add('background-white');
//     servicesMenu.classList.add('highlight');
//     aboutMenu.classList.remove('highlight');
//     return;
//   }

//   if ((elem && window.innerWIdth < 960 && scrollPos < 600) || elem) {
//     elem.classList.remove('highlight');
//     navbar.classList.remove('background-glass');
//     //alert("1");
//   }
//   if(window.innerWidth <= 960 && scrollPos > 100 && !navbar.classList.contains('background-white'))
//   {
//      navbar.classList.add('background-glass');
//     //  alert("1");
//     //navLogo.innerHTML=scrollPos;
//     //return
//   }
//   else
//    navbar.classList.remove('background-glass');
// };
const highlightMenu = () => {
  const heroSection = document.querySelector("#hero");

  const aboutSection = document.querySelector("#about");
  const catalogSection = document.querySelector("#catalog");
  const contactSection = document.querySelector("#contact");

  const aboutMenu = document.querySelector("#home-page");
  const catalogMenu = document.querySelector("#about-page");
  const contactMenu = document.querySelector("#services-page");

  if (!aboutSection || !catalogSection || !contactSection) return;

  const scrollPos = window.scrollY;
  const navHeight = navbar.offsetHeight;

  const heroTop =
    heroSection.getBoundingClientRect().top + window.scrollY - navHeight;

  const aboutTop =
    aboutSection.getBoundingClientRect().top + window.scrollY - navHeight;
  const catalogTop =
    catalogSection.getBoundingClientRect().top + window.scrollY - navHeight;
  const contactTop =
    contactSection.getBoundingClientRect().top + window.scrollY - navHeight;
  const contactBottom = contactTop + contactSection.offsetHeight;

  // очищаем
  aboutMenu.classList.remove("highlight");
  catalogMenu.classList.remove("highlight");
  contactMenu.classList.remove("highlight");

  if (window.innerWidth > 960) {
    if (scrollPos >= heroTop && scrollPos <= aboutTop)
      navbar.classList.add("background-glass");
    else if (scrollPos >= aboutTop && scrollPos < catalogTop) {
      aboutMenu.classList.add("highlight");
      navbar.classList.add("background-glass");
    } else if (scrollPos >= catalogTop && scrollPos < contactTop) {
      catalogMenu.classList.add("highlight");
      navbar.classList.add("background-glass");
    } else if (scrollPos >= contactTop && scrollPos < contactBottom) {
      contactMenu.classList.add("highlight");
      navbar.classList.add("background-glass");
    } else {
      navbar.classList.remove("background-glass");
    }
  }

  if (window.innerWidth < 960) {
    if (scrollPos >= heroTop) navbar.classList.add("background-glass");
    else navbar.classList.remove("background-glass");
  }
};

window.addEventListener("scroll", highlightMenu);
window.addEventListener("resize", highlightMenu);
document.addEventListener("DOMContentLoaded", highlightMenu);

//  Close mobile Menu when clicking on a menu item
const hideMobileMenu = () => {
  const menuBars = document.querySelector(".is-active");

  if (window.innerWidth <= 768 && menuBars) {
    // const element = document.getElementById('navbar__logo');
    // element.style.color='blue';
    menu.classList.toggle("is-active");
    menuLinks.classList.remove("active");
    document.querySelector("body").classList.remove("active");
    document.querySelector("#telInfo").classList.remove("active");
  }
};

menuLinks.addEventListener("click", hideMobileMenu);
navLogo.addEventListener("click", hideMobileMenu);

const pattern = document.querySelector(".pattern-track");

if (pattern) {

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          pattern.classList.add("animate");
        } else {
          pattern.classList.remove("animate");
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  observer.observe(pattern);
}

const listSection = document.querySelector(".list");

const listObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      listSection.classList.add("visible");
    }
  },
  { threshold: 0.2 },
);

listObserver.observe(listSection);

// ===== АКТИВНЫЙ МАГАЗИН =====

const shops = document.getElementById("shops");

shops.addEventListener("click", function (e) {
  if (e.target.tagName === "LI") {
    document
      .querySelectorAll("#shops li")
      .forEach((li) => li.classList.remove("active"));

    e.target.classList.add("active");
  }
});

// ===== МОБИЛЬНАЯ КНОПКА =====

const btn = document.querySelector(".show-shops-btn");
const shopPanel = document.querySelector(".info-shop");

btn.addEventListener("click", () => {
  shopPanel.classList.toggle("open");
});



