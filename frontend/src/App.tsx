import "./App.css";
import AppRoutes from "./routes";
import { useEffect } from "react";
import { useLazyRefreshQuery } from "./store/api/authApi";

const App: React.FC = () => {
  const [triggerRefresh] = useLazyRefreshQuery();

  useEffect(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  console.log(localStorage);
  return (
    <div className="page-container">
      <AppRoutes />
    </div>
  );
};

export default App;