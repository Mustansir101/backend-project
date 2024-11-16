//async handler using try-catch & async-await
const asyncHandler = (fn) => { async (req,res,next) => {
    try {
        return await fn(req,res,next)
    } catch (error) {
        res.send(err.code).json({
            success: false,
            message: err.message
        })
    }
}}

//async handler with promise
const asyncHandler1 = (reqHandler)=>{
    return (req,res,next) => {
        Promise
        .resolve(reqHandler(req,res,next))
        .catch((err)=>next(err))
    }
}

export {asyncHandler1}