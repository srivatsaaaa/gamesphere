import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Discover from "@/pages/Discover";
import GameDetail from "@/pages/GameDetail";
import Compatibility from "@/pages/Compatibility";
import Recommendations from "@/pages/Recommendations";
import Library from "@/pages/Library";
import MyRig from "@/pages/MyRig";

function App() {
    return (
        <div className="App min-h-screen">
            <BrowserRouter>
                <Navbar />
                <main>
                    <Routes>
                        <Route path="/" element={<Discover />} />
                        <Route path="/game/:id" element={<GameDetail />} />
                        <Route path="/compatibility" element={<Compatibility />} />
                        <Route path="/recommendations" element={<Recommendations />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/my-rig" element={<MyRig />} />
                    </Routes>
                </main>
                <Toaster theme="dark" position="bottom-right" richColors />
            </BrowserRouter>
        </div>
    );
}

export default App;
