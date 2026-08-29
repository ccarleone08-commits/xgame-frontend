import { useLocation } from "react-router-dom";
import { useEffect } from "react";

function RouteStyleController() {
  const location = useLocation();

  useEffect(() => {
    const noScrollRoutes = ["/games/backgammon", "/games/domino", "/games/seka", "/games/durak", "/games/loto", "/games/poker", "/games/okey"];
    const noLayoutRoutes = ["/games/backgammon", "/games/domino", "/games/seka", "/games/durak",
      "/games/loto", "/games/loto/room_0.20", "/games/loto/room_0.50", "/games/loto/room_1.00", "/games/loto/room_2.00", "/games/loto/room_5.00", "/games/loto/room_10.00", "/games/loto/room_20.00"
      , "/games/loto/room_50.00", "/games/loto/room_100.00"
      , "/games/poker", "/games/okey"];


    // For no Scrooll Routes
    if (noScrollRoutes.includes(location.pathname)) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none"; // mobil zoom üçün
    } else {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    }

    // For no Layout Routes
    if (noLayoutRoutes.includes(location.pathname)) {
      document.body.classList.add("no-layout");
    } else {
      document.body.classList.remove("no-layout");
    }

    // Cleanup
    return () => {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
      document.body.classList.remove("no-layout");
    };
  }, [location.pathname]);

  return null;
}

export default RouteStyleController;