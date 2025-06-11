import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
    showSimpleHomePage,
    showHomePage,
    showStatisticsPage,
    showReviewsPage,
    showBankReviewsPage,
    showEvaluatePage,
    showThankYouPage,
    showLeaderboardPage,
    showBenefitsPage,
    handleEvaluateSubmit,
    showReportProblemPage,
    showThankYouReportPage,
    showBankReportsPage,
    showSummaryPage
} from "../controllers/pageController.ts";

const pageRouter = new Router();

// GET routes for serving pages
pageRouter.get("/", showSimpleHomePage); // Nueva página de inicio simple
pageRouter.get("/status", showHomePage); // Página de estados
pageRouter.get("/statistics", showStatisticsPage);
pageRouter.get("/reviews", showReviewsPage);
pageRouter.get("/reviews/:banco", showBankReviewsPage);
pageRouter.get("/evaluate/:banco", showEvaluatePage);
pageRouter.get("/thank-you", showThankYouPage);
pageRouter.get("/leaderboard", showLeaderboardPage);
pageRouter.get("/benefits", showBenefitsPage);
pageRouter.get("/summary", showSummaryPage);
pageRouter.get("/report-problem/:banco", showReportProblemPage);
pageRouter.get("/thank-you-report", showThankYouReportPage);
pageRouter.get("/reports/:banco", showBankReportsPage);

// POST routes for form submission
pageRouter.post("/evaluate/:banco", handleEvaluateSubmit);
// Note: The report submission logic wasn't fully implemented in the original code,
// so there's no POST /reportar route here yet.

export default pageRouter; 