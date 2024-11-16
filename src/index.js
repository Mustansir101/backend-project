import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from "./app.js";
dotenv.config()

connectDB()
.then(()=>{
    app.on("error", (err)=>{
        console.log("Error in loading app: ",err);
    })
    
    app.listen(process.env.PORT || 8000, ()=>{
        console.log("Listening on port: ", process.env.PORT);
    })

})
