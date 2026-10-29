import { Outlet } from "react-router-dom";
import Topbar from "../components/layout/Topbar";
import BackButton from "../components/common/BackButton";

export default function AppLayout() {
  return (
    <div className="vsync-app-shell min-h-screen">
      <Topbar />
      <main className="mx-auto w-full max-w-[1500px] px-3 pb-6 sm:px-3 lg:px-4">
        <BackButton />
        <Outlet />
      </main>
    </div>
  );
}
