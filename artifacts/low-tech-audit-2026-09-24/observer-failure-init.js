window.IntersectionObserver = function FailingIntersectionObserver() {
  throw new Error("Intentional observer initialization failure for QA");
};
