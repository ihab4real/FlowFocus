function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome to FlowFocus
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Start managing your tasks and boost your productivity.
        </p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-xl font-semibold text-gray-900">Getting Started</h3>
        <ul className="mt-4 space-y-3 text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              Create your first task by clicking the "New Task" button
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Organize your tasks into projects</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Track your progress and stay focused</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
