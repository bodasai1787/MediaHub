const asyncHandler = (fn) => async(req, res, next) => {
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(error.code || 500).json({
            success : false,
            message : error.message
        })
    }
}
// NOTE : This implementation uses the async code but in actual it is implemented in promises using higher order functions
export {asyncHandler}