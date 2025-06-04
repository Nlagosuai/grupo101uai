import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getBankStatusesApi, getLeaderboard, getBenefitsApi, getBankBenefitsApi } from "../controllers/apiController.ts";
// Potentially import other API controllers here

const apiRouter = new Router();

apiRouter.get("/api/statuses", getBankStatusesApi);
apiRouter.get("/api/leaderboard", getLeaderboard);
apiRouter.get("/api/benefits", getBenefitsApi);
apiRouter.get("/api/benefits/:banco", getBankBenefitsApi);
// Example: apiRouter.get("/api/reseñas", getAllReviews);

export default apiRouter; 