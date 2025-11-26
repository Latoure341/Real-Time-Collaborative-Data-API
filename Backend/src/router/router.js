const express = require('express');
const router = express.Router();

//Landing page
router.get("/", (req, res)=>{
    res.status(200).send("Real-Time Collaborative Data API is running");
})
//About page
router.get("/about", (req, res)=>{
    res.status(200).send("This is a Real-Time Collaborative Data API built with Express.js");
})
//Login page
router.post("/login", (req, res)=>{
    const { username, password} = req.body;

    //Dummy authentication logic
    if(username === "admin" && password === "password"){
        res.status(200).json({ message: "Login successful"});
    } else {
        res.status(401).json({ message: "Invalid credentials"});
    }
})

module.exports = router;
