export default function Dashboard() {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to the Dashboard</h1>
          <p className="text-gray-700">This is a sample dashboard.</p>
  
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold">Users</h2>
              <p>100</p>
            </div>
            <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold">Sales</h2>
              <p>$5,000</p>
            </div>
          </div>
  
          <button className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            Logout
          </button>
        </div>
      </div>
    );
  }
  