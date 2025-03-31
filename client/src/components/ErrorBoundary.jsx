function ErrorBoundary() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-xl text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Oops! Something went wrong
        </h2>
        <p className="mb-4 text-gray-600">
          We're sorry, but there was an error processing your request.
        </p>
        <a
          href="/"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}

export default ErrorBoundary;
