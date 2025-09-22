require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(express.json());
//Logging Middleware
app.use(morgan('dev'));
//Custom Middleware
const { middle, notFound, errorHandler } = require("./middleware/middleware");
app.use(middle);
app.use(notFound);
app.use(errorHandler);

//Routing
const router = require("./router/router");
app.use(router);

//Start the server
app.listen(PORT, ()=>{
    console.log("Server is running on port " + PORT);
})
