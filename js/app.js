window.onload = function() {
  document.getElementById('phone').value = ""; 
  };
const menu = document.querySelector('#mobile-menu');
const menuLinks = document.querySelector('.navbar__menu');
const navLogo = document.querySelector('#navbar__logo');
const element = document.getElementById('navbar');

// $(document).ready(function(){
//   var body = $("body");
//   body.fadeIn(500);
//   $(document).on("click", "a:not([href^='#']):not([href^='tel']):not([href^='mailto'])", function(e) {
//    e.preventDefault();
//    $("body").fadeOut(500);
//    var self = this;
//    setTimeout(function () {
//     window.location.href = $(self).attr("href");
//    }, 500);
//   });
//  });
 
// Display Mobile Menu
const mobileMenu = () => {
  document.querySelector('body').classList.toggle('active');
  document.querySelector('#telInfo').classList.toggle('active');
  menu.classList.toggle('is-active');
  menuLinks.classList.toggle('active');
  if(element.style.backgroundColor=='white')
    element.style.backgroundColor='transparent';
  else
    element.style.backgroundColor='white';    

};


    
menu.addEventListener('click', mobileMenu);

// Show active menu when scrolling
const highlightMenu = () => {
  const elem = document.querySelector('.highlight');
  const homeMenu = document.querySelector('#home-page');
  const aboutMenu = document.querySelector('#about-page');
  const servicesMenu = document.querySelector('#services-page');
  let scrollPos = window.scrollY;
  // console.log(scrollPos);

  // adds 'highlight' class to my menu items
  if (window.innerWidth > 960 && scrollPos < 1400) {
    homeMenu.classList.add('highlight');
    aboutMenu.classList.remove('highlight');
    return;
  } else if (window.innerWidth > 960 && scrollPos < 3000) {
    aboutMenu.classList.add('highlight');
    homeMenu.classList.remove('highlight');
    servicesMenu.classList.remove('highlight');
    return;
  } else if (window.innerWidth > 960 && scrollPos < 4000) {
    servicesMenu.classList.add('highlight');
    aboutMenu.classList.remove('highlight');
    return;
  }

  if ((elem && window.innerWIdth < 960 && scrollPos < 600) || elem) {
    elem.classList.remove('highlight');
  }
};

// (function($) {
//   "use strict"; // Start of use strict

//   // Smooth scrolling using jQuery easing
//   $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
//     if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
//       var target = $(this.hash);
//       target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
//       if (target.length) {
//         $('html, body').animate({
//           scrollTop: (target.offset().top - 70)
//         }, 1000, "easeInOutExpo");
//         return false;
//       }
//     }
//   });

//   // Scroll to top button appear
//   $(document).scroll(function() {
//     var scrollDistance = $(this).scrollTop();
//     if (scrollDistance > 100) {
//       $('.scroll-to-top').fadeIn();
//     } else {
//       $('.scroll-to-top').fadeOut();
//     }
//   });

//   // Closes responsive menu when a scroll trigger link is clicked
//   $('.js-scroll-trigger').click(function() {
//     $('.navbar-collapse').collapse('hide');
//   });

//   // Activate scrollspy to add active class to navbar items on scroll
//   $('body').scrollspy({
//     target: '#mainNav',
//     offset: 80
//   });

//   // Collapse Navbar
//   var navbarCollapse = function() {
//     if ($("#mainNav").offset().top > 100) {
//       $("#mainNav").addClass("navbar-shrink");
//     } else {
//       $("#mainNav").removeClass("navbar-shrink");
//     }
//   };
//   // Collapse now if page is not at top
//   navbarCollapse();
//   // Collapse the navbar when page is scrolled
//   $(window).scroll(navbarCollapse);

//   // Floating label headings for the contact form
//   $(function() {
//     $("body").on("input propertychange", ".floating-label-form-group", function(e) {
//       $(this).toggleClass("floating-label-form-group-with-value", !!$(e.target).val());
//     }).on("focus", ".floating-label-form-group", function() {
//       $(this).addClass("floating-label-form-group-with-focus");
//     }).on("blur", ".floating-label-form-group", function() {
//       $(this).removeClass("floating-label-form-group-with-focus");
//     });
//   });

// })(jQuery); // End of use strict


window.addEventListener('scroll', highlightMenu);
window.addEventListener('click', highlightMenu);

//  Close mobile Menu when clicking on a menu item
const hideMobileMenu = () => {
  const menuBars = document.querySelector('.is-active');
  
  if (window.innerWidth <= 768 && menuBars) {
    // const element = document.getElementById('navbar__logo');
    // element.style.color='blue';
   menu.classList.toggle('is-active');
    menuLinks.classList.remove('active');
    document.querySelector('body').classList.remove('active');
    document.querySelector('#telInfo').classList.remove('active');
    
     
  }
};

menuLinks.addEventListener('click', hideMobileMenu);
navLogo.addEventListener('click', hideMobileMenu);

