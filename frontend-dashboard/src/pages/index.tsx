import Head from 'next/head';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function Home() {
  

  return (
    <>
      <Head>
        <title>Synkro Dashboard</title>
        <meta name="description" content="AI-Fueled Supply Chain Optimization Platform Dashboard" />
      </Head>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card-neo">
              <div className="card-header">
                <h3 className="card-title">Inventory Overview</h3>
                <p className="card-description">Current stock levels and alerts</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total SKUs</span>
                    <span className="font-bold">1,245</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Low Stock Alerts</span>
                    <span className="font-bold text-destructive">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overstock Items</span>
                    <span className="font-bold text-amber-500">18</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button className="btn btn-outline w-full">View Details</button>
              </div>
            </div>

            <div className="card-neo">
              <div className="card-header">
                <h3 className="card-title">Order Status</h3>
                <p className="card-description">Recent order activity</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Pending</span>
                    <span className="font-bold">32</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Processing</span>
                    <span className="font-bold text-blue-500">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Shipped</span>
                    <span className="font-bold text-green-500">47</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button className="btn btn-outline w-full">View Orders</button>
              </div>
            </div>

            <div className="card-neo">
              <div className="card-header">
                <h3 className="card-title">AI Predictions</h3>
                <p className="card-description">Demand forecasting insights</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Predicted Growth</span>
                    <span className="font-bold text-green-500">+12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Trending Products</span>
                    <span className="font-bold">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Restock Recommendations</span>
                    <span className="font-bold text-blue-500">15</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button className="btn btn-outline w-full">View Predictions</button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 