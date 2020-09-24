const express = require("express");
const router = express.Router();

router.get("/EmojiSharing",(req, res) => {
    console.log("the class id is: "+req.query.classID);
    const passClassID = req.query.classID;
        res.render("home", {
            classID: passClassID
        });


});

router.get("/generateLink",(req, res) => {
    console.log(req.query);
    let classID = req.query.classID;
    let pasClassID = "http://localhost:3000/EmojiSharing/?classID="+classID;

    res.render("generateLink", {
        classID: pasClassID


    });
});



module.exports = router;