import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// use method is for middleware / config
// origin is *, matlab from everywhere
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);

// json limit, taaki server crash na ho
app.use(express.json({ limit: "16kb" }));

//url encode karna allow karta hai, the %20 in url inplaceof space
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//kuch bhi file ho to usko public folder mai dalo
app.use(express.static("public"));
app.use(cookieParser()); //use cookie

//routes
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthchecks.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

app.use("/api/v1/users", userRouter); //http:8000/api/v1/users/register
app.use("/api/v1/healthcheck", healthcheckRouter);

app.use(errorHandler); // extra

export { app };
