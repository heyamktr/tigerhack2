const swiper = new Swiper('.swiper-container', {
    direction: 'vertical',
    effect: 'fade',
    speed: 1000,
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    mousewheel: {
      invert: false,
      forceToAxis: true, // `forceToAxis` should generally be true for vertical swipes
      sensitivity: 1, // Sensitivity of mousewheel
    },
    on: {
      slideChange: function () {
        // Remove animation class from all slides
        this.slides.forEach((slide) => {
          let background = slide.querySelector('.background');
          if (background) {
            background.classList.remove('animation');
          }
        });
  
        // Add animation class to the active slide's background
        let activeSlide = this.slides[this.activeIndex];
        let background = activeSlide.querySelector('.background');
        if (background) {
          background.classList.add('animation');
        }
      },
    },
  });
  