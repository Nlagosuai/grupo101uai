import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
    showHomePage,
    showStatisticsPage,
    showReviewsPage,
    showBankReviewsPage,
    showEvaluatePage,
    showReportPage,
    handleEvaluateSubmit,
    showThankYouPage
} from "../controllers/pageController.ts";

const pageRouter = new Router();

// GET routes for serving pages
pageRouter.get("/", showHomePage); // Home page (shows bank statuses)
pageRouter.get("/status", showHomePage); // Alias for home page
pageRouter.get("/statistics", showStatisticsPage);
pageRouter.get("/reviews", showReviewsPage);
pageRouter.get("/reviews/:banco", showBankReviewsPage);
pageRouter.get("/evaluate/:banco", showEvaluatePage);
pageRouter.get("/report", showReportPage);
pageRouter.get("/thank-you", showThankYouPage);

// POST route for form submission
pageRouter.post("/evaluate/:banco", handleEvaluateSubmit);
// Note: The report submission logic wasn't fully implemented in the original code,
// so there's no POST /reportar route here yet.

export default pageRouter; 