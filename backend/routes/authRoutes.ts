import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { showLoginPage, handleLogin, handleLogout } from "../controllers/authController.ts";

const authRouter = new Router();

authRouter.get("/login", showLoginPage); 
authRouter.post("/api/login", handleLogin); // Keep API prefix for clarity
authRouter.get("/logout", handleLogout);

export default authRouter; 