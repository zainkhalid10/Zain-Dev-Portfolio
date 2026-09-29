import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";

const Gateway = lazy(() => import("./pages/Gateway"));
const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const Play = lazy(() => import("./pages/Play"));
const CreativePortfolio = lazy(() => import("./pages/creative/CreativePortfolio"));
import { LoadingProvider } from "./context/LoadingProvider";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Gateway — portfolio selector */}
        <Route
          path="/"
          element={
            <Suspense fallback={<div style={{ background: "#08060a", width: "100vw", height: "100vh" }} />}>
              <Gateway />
            </Suspense>
          }
        />
        {/* Developer Portfolio (moved from /) */}
        <Route
          path="/dev"
          element={
            <LoadingProvider>
              <Suspense>
                <MainContainer>
                  <Suspense>
                    <CharacterModel />
                  </Suspense>
                </MainContainer>
              </Suspense>
            </LoadingProvider>
          }
        />
        {/* Project archive */}
        <Route
          path="/myworks"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <MyWorks />
            </Suspense>
          }
        />
        {/* Interactive play page */}
        <Route
          path="/play"
          element={
            <Suspense fallback={<div>Loading...</div>}>
              <Play />
            </Suspense>
          }
        />
        {/* Creative Portfolio */}
        <Route
          path="/creative"
          element={
            <Suspense fallback={<div style={{ background: "#0d0a06", width: "100vw", height: "100vh" }} />}>
              <CreativePortfolio />
            </Suspense>
          }
        />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
};

export default App;
