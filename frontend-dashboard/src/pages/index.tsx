import Head from "next/head";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Dashboard from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <>
      <Head>
        <title>Synkro Dashboard</title>
        <meta
          name="description"
          content="AI-Fueled Supply Chain Optimization Platform Dashboard"
        />
      </Head>
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    </>
  );
}
