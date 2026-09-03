import { Outlet } from "react-router-dom";
import Topbar from "../components/layout/Topbar";
export default function AppLayout(){return <div className="min-h-screen bg-[#f5f7f9]"><Topbar/><main className="mx-auto w-full max-w-[1500px] px-3 pb-10 sm:px-5 lg:px-7"><Outlet/></main></div>}
