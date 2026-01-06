let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}    
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " active";
}


function addToCart(event, productId) {
  event.stopPropagation();
  event.preventDefault();
  alert("Item added to cart!");
}

document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('menuToggle');
    const mobileOverlay = document.querySelector('.moble-overlay');

    if (mobileToggle && mobileOverlay) {
        mobileToggle.addEventListener('click', () => {
            if (mobileOverlay.style.display === 'block') {
                mobileOverlay.style.opacity = '0';
                setTimeout(() => {
                    mobileOverlay.style.display = 'none';
                }, 300); // Match CSS transition duration
            } else {
                mobileOverlay.style.display = 'block';
                setTimeout(() => {
                    mobileOverlay.style.opacity = '1';
                }, 10);
            }
        });

        // Close overlay when clicking on it
        mobileOverlay.addEventListener('click', () => {
            if (mobileOverlay.style.display === 'block') {
                mobileOverlay.style.opacity = '0';
                setTimeout(() => {
                    mobileOverlay.style.display = 'none';
                }, 300); // Match CSS transition duration
            }
        });
    }
});
