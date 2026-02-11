import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProtectedRoutes } from "./components/ProtectedRoutes";
import { AppLayout } from "./components/AppLayout";

const Auth = React.lazy(() =>
  import("./pages/Auth").then((m) => ({ default: m.Auth }))
);
const Chat = React.lazy(() =>
  import("./pages/Chat").then((m) => ({ default: m.Chat }))
);
const People = React.lazy(() =>
  import("./pages/People").then((m) => ({ default: m.People }))
);
const Meetings = React.lazy(() =>
  import("./pages/Meetings").then((m) => ({ default: m.Meetings }))
);
const Notes = React.lazy(() =>
  import("./pages/Notes").then((m) => ({ default: m.Notes }))
);
const Todos = React.lazy(() =>
  import("./pages/Todos").then((m) => ({ default: m.Todos }))
);
const Philosophies = React.lazy(() =>
  import("./pages/Philosophies").then((m) => ({ default: m.Philosophies }))
);
const Roadmaps = React.lazy(() =>
  import("./pages/Roadmaps").then((m) => ({ default: m.Roadmaps }))
);
const Calendar = React.lazy(() =>
  import("./pages/Calendar").then((m) => ({ default: m.Calendar }))
);
const Settings = React.lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.Settings }))
);

function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-white/40" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <AppLayout />
            </ProtectedRoutes>
          }
        >
          <Route index element={<Chat />} />
          <Route path="people" element={<People />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="notes" element={<Notes />} />
          <Route path="todos" element={<Todos />} />
          <Route path="philosophies" element={<Philosophies />} />
          <Route path="roadmaps" element={<Roadmaps />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
