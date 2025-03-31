function NotFound() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-gray-900 mb-4">
        404 - Page Not Found
      </h2>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Return Home
      </a>
    </div>
  );
}

export default NotFound;
