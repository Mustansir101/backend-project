import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// use method is for middleware / config
// origin is *, matlab from everywhere
app.use(cors({
    origin: process.env.CORS_ORIGIN,
}))

// json limit, taaki server crash na ho
app.use(express.json({limit: "16kb"}))

//url encode karna allow karta hai
app.use(express.urlencoded())

//kuch bhi file ho to usko public folder mai dalo
app.use(express.static("public"))
app.use(cookieParser()) //use cookie
export default app;