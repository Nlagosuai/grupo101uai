import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getBankStatusesApi, getLeaderboard, getBankSummaryPdf } from '../controllers/apiController.ts';
import { getBenefitsApi, getBankBenefitsApi } from "../controllers/apiController.ts";
import { handleProblemReportSubmit } from "../controllers/problemController.ts";
// Potentially import other API controllers here

const apiRouter = new Router();

apiRouter.get("/api/status", getBankStatusesApi);
apiRouter.get("/api/leaderboard", getLeaderboard);
apiRouter.get("/api/summary/:banco/pdf", getBankSummaryPdf);
apiRouter.get("/api/benefits", getBenefitsApi);
apiRouter.get("/api/benefits/:banco", getBankBenefitsApi);
apiRouter.post("/api/report-problem", handleProblemReportSubmit);
// Example: apiRouter.get("/api/reseñas", getAllReviews);

export default apiRouter; 