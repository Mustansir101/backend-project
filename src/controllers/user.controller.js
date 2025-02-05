import {asyncHandler1} from "../utils/asyncHandler.js";

const registerUser = asyncHandler1( async(req, res) => {
    // get user details
    const {username, email, fullname, password} = req.body;
    console.log(username, email, fullname, password);

    // validate - not empty
    // check is user exists- username & email
    // check for imgs and avatar
    // cloudinary
    // create entry in db
    // remove password and refresh token from respond

})

export {registerUser}