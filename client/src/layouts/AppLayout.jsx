import { Outlet } from "react-router-dom";
import Topbar from "../components/layout/Topbar";

export default function AppLayout() {
  return (
    <div className="vsync-app-shell min-h-screen">
      <Topbar />
      <main className="vsync-app-content mx-auto w-full max-w-[1680px]">
        <Outlet />
      </main>
    </div>
  );
}
