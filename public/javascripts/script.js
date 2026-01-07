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


function addToCart(event, proId) {
  if (typeof event === 'object') {
    event.stopPropagation();
    event.preventDefault();
  }

  let productId = proId || event;

  if (!productId) {
    console.error("Product ID is missing in addToCart call");
    return;
  }

  $.ajax({
      url:'/add-to-cart/'+productId,
      method:'post',
      success:(response)=>{
          if(response.status){
              let countElement = $('.cart-badge');
              let count = parseInt(countElement.html() || 0);
              countElement.html(count + 1);
              if(countElement.length === 0){
                $('.cart-action').append('<span class="cart-badge" style="background: var(--primary); color: white; border-radius: 50%; padding: 0.1em 0.4em; font-size: 0.8rem; margin-left: 5px;">1</span>');
              }
              alert("Item added to cart!");
          } else if (response.error) {
              alert(response.error);
          }
      },
      error: (jqXHR, textStatus, errorThrown) => {
        if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
            alert('Error: ' + jqXHR.responseJSON.error);
        } else {
            alert('An error occurred while adding the item to the cart.');
        }
      }
  })
}