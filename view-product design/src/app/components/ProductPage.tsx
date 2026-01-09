import { useState } from "react";
import Slider from "react-slick";
import { Star, ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, ThumbsUp } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Product images
const productImages = [
  "https://images.unsplash.com/photo-1578517581165-61ec5ab27a19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBwcm9kdWN0fGVufDF8fHx8MTc2Nzg0NjcyNXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1561262138-ff982ebe0783?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwc3R1ZGlvJTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDF8fHx8MTc2Nzg0NjcyNXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGhlYWRwaG9uZXMlMjBjbG9zZSUyMHVwfGVufDF8fHx8MTc2Nzg0NjcyNXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1713801129175-8e60c67e0412?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwaGVhZHBob25lcyUyMGRldGFpbHxlbnwxfHx8fDE3Njc4NDY3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080",
];

// Mock reviews data
const initialReviews = [
  {
    id: 1,
    author: "Sarah Johnson",
    rating: 5,
    date: "January 5, 2026",
    title: "Outstanding sound quality!",
    comment: "These headphones exceeded my expectations. The noise cancellation is phenomenal, and the battery life is exactly as advertised. Highly recommend!",
    helpful: 45,
    verified: true,
  },
  {
    id: 2,
    author: "Michael Chen",
    rating: 4,
    date: "January 3, 2026",
    title: "Great but a bit pricey",
    comment: "The sound quality is excellent and they're very comfortable for long listening sessions. The only downside is the price, but you get what you pay for.",
    helpful: 32,
    verified: true,
  },
  {
    id: 3,
    author: "Emma Davis",
    rating: 5,
    date: "December 28, 2025",
    title: "Perfect for travel",
    comment: "I travel frequently and these headphones have been a game-changer. The ANC blocks out airplane noise completely. Worth every penny!",
    helpful: 28,
    verified: true,
  },
];

// Custom arrow components
function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all"
    >
      <ChevronRight className="w-5 h-5 text-gray-800" />
    </button>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all"
    >
      <ChevronLeft className="w-5 h-5 text-gray-800" />
    </button>
  );
}

export function ProductPage() {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: "",
    comment: "",
  });
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating > 0 && newReview.title && newReview.comment) {
      const review = {
        id: reviews.length + 1,
        author: "You",
        rating: newReview.rating,
        date: new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "long", 
          day: "numeric" 
        }),
        title: newReview.title,
        comment: newReview.comment,
        helpful: 0,
        verified: false,
      };
      setReviews([review, ...reviews]);
      setNewReview({ rating: 0, title: "", comment: "" });
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    customPaging: () => (
      <div className="w-2 h-2 bg-gray-300 rounded-full hover:bg-[#00A8E8] transition-colors"></div>
    ),
    dotsClass: "slick-dots !bottom-6",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00A8E8] rounded"></div>
            <span className="text-xl">Eleart</span>
          </div>
          <nav className="flex gap-6">
            <a href="#" className="text-gray-700 hover:text-[#00A8E8]">Categories</a>
            <a href="#" className="text-gray-700 hover:text-[#00A8E8]">Deals</a>
            <a href="#" className="text-gray-700 hover:text-[#00A8E8]">Support</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Slider */}
          <div className="relative bg-gray-50 rounded-lg overflow-hidden">
            <Slider {...sliderSettings}>
              {productImages.map((image, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={image}
                    alt={`Product view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </Slider>
          </div>

          {/* Product Details */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl mb-2">Premium Wireless Headphones</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-gray-600">4.8 (2,547 reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl text-[#00A8E8]">$299.99</span>
              <span className="text-xl text-gray-400 line-through">$399.99</span>
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-md">25% OFF</span>
            </div>

            <div className="border-t border-b border-gray-200 py-6">
              <h3 className="mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                Experience premium sound quality with our flagship wireless headphones. 
                Featuring advanced noise cancellation, 40-hour battery life, and premium 
                comfort materials. Perfect for music lovers and professionals alike.
              </p>
            </div>

            <div>
              <h3 className="mb-3">Key Features</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-[#00A8E8] mt-1">•</span>
                  <span>Active Noise Cancellation (ANC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00A8E8] mt-1">•</span>
                  <span>40-hour battery life with quick charge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00A8E8] mt-1">•</span>
                  <span>Premium leather ear cushions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00A8E8] mt-1">•</span>
                  <span>Bluetooth 5.0 with multi-device connectivity</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-gray-700">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  -
                </button>
                <span className="px-6 py-2 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-[#00A8E8] hover:bg-[#0097D1] text-white px-6 py-3 rounded-md flex items-center justify-center gap-2 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="border border-gray-300 hover:border-[#00A8E8] hover:text-[#00A8E8] px-4 py-3 rounded-md transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="border border-gray-300 hover:border-[#00A8E8] hover:text-[#00A8E8] px-4 py-3 rounded-md transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Free Shipping</span>
                <span className="text-gray-900">On orders over $50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="text-gray-900">3-5 business days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Returns</span>
                <span className="text-gray-900">30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Rating</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Reviews</span>
              <span className="text-gray-900">2,547</span>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">Write a Review</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-700">Rating:</span>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${hoverRating > i ? "fill-yellow-400" : "fill-gray-300"}`}
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                  />
                ))}
              </div>
              <input
                type="text"
                placeholder="Title"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
              />
              <textarea
                placeholder="Comment"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mb-4"
                rows={4}
              />
              <button
                type="submit"
                className="bg-[#00A8E8] hover:bg-[#0097D1] text-white px-6 py-3 rounded-md transition-colors"
              >
                Submit Review
              </button>
            </form>
          </div>

          <div className="mt-8">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < review.rating ? "fill-yellow-400" : "fill-gray-300"}`} />
                    ))}
                  </div>
                  <span className="text-gray-600">{review.date}</span>
                </div>
                <h4 className="text-xl font-bold mt-2">{review.title}</h4>
                <p className="text-gray-700 leading-relaxed mt-2">{review.comment}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ThumbsUp className="w-5 h-5 text-gray-800" />
                  <span className="text-gray-600">{review.helpful} helpful</span>
                </div>
                {review.verified && (
                  <div className="mt-2">
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-md">Verified Purchase</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}