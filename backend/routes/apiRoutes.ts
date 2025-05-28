import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getBankStatusesApi, getLeaderboard } from "../controllers/apiController.ts";
// Potentially import other API controllers here

const apiRouter = new Router();

apiRouter.get("/api/statuses", getBankStatusesApi);
apiRouter.get("/api/leaderboard", getLeaderboard);
// Example: apiRouter.get("/api/reseñas", getAllReviews);

export default apiRouter; 