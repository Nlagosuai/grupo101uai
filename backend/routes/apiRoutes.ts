import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getBankStatuses } from "../controllers/apiController.ts";
// Potentially import other API controllers here

const apiRouter = new Router();

apiRouter.get("/api/estados", getBankStatuses);
// Example: apiRouter.get("/api/reseñas", getAllReviews);

export default apiRouter; 