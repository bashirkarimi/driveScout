import { useState, useEffect, useRef, useCallback } from "react";

export const ImageCarousel = ({ images, alt = "Vehicle" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const thumbnailRefs = useRef([]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? (images?.length || 1) - 1 : prevIndex - 1
    );
  }, [images?.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === (images?.length || 1) - 1 ? 0 : prevIndex + 1
    );
  }, [images?.length]);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Scroll thumbnail into view when current index changes
  useEffect(() => {
    if (thumbnailRefs.current[currentIndex]) {
      thumbnailRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!carouselRef.current?.contains(document.activeElement)) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "Home":
          e.preventDefault();
          goToSlide(0);
          break;
        case "End":
          e.preventDefault();
          goToSlide((images?.length || 1) - 1);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, goToSlide, images?.length]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full" ref={carouselRef}>
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="h-full w-full object-cover"
        />

        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 rounded-full bg-black/50 px-2 py-0.5 md:px-3 md:py-1 text-sm text-white">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex content-between mt-1 md:mt-3">
          <div
            className="flex gap-2 overflow-x-auto py-2 px-1"
            role="region"
            aria-label="Image thumbnails"
            tabIndex={0}
          >
            {images.map((image, index) => (
              <button
                key={image}
                ref={(el) => (thumbnailRefs.current[index] = el)}
                onClick={() => goToSlide(index)}
                className={`shrink-0 overflow-hidden rounded-lg border transition-all focus:outline-none focus:ring-1 focus:ring-elm-500 ${
                  index === currentIndex
                    ? "border-elm-500 ring-1 ring-elm-300"
                    : "border-transparent hover:border-slate-300"
                }`}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="h-10 w-12 md:h-16 md:w-20 object-cover"
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center ml-auto pl-2">
            <button
              onClick={goToPrevious}
              className=" rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Previous image"
            >
              <svg
                className="h-4 w-4 md:h-6 md:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className=" rounded-full bg-black/50 p-2 text-white transition-all hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Next image"
            >
              <svg
                className="h-4 w-4 md:h-6 md:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
