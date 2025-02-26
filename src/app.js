import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

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

//routes import
import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthchecks.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter); //http:8000/api/v1/users/register
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(errorHandler); // extra

export { app };
