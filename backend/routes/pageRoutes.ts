import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
    showHomePage,
    showEstadisticasPage,
    showReseñasPage,
    showReseñasBancoPage,
    showEvaluarPage,
    showReportarPage,
    handleEvaluarSubmit
} from "../controllers/pageController.ts";

const pageRouter = new Router();

// GET routes for serving pages
pageRouter.get("/", showHomePage); // Home page (shows bank statuses)
pageRouter.get("/estados", showHomePage); // Alias for home page
pageRouter.get("/estadisticas", showEstadisticasPage);
pageRouter.get("/reseñas", showReseñasPage);
pageRouter.get("/reseñas/:banco", showReseñasBancoPage);
pageRouter.get("/evaluar/:banco", showEvaluarPage);
pageRouter.get("/reportar", showReportarPage);

// POST route for form submission
pageRouter.post("/evaluar/:banco", handleEvaluarSubmit);
// Note: The report submission logic wasn't fully implemented in the original code,
// so there's no POST /reportar route here yet.

export default pageRouter; 