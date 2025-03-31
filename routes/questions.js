var express = require('express');
var router = express.Router();
var fs = require('fs');
var questionObjects;
var currentQuestion;
var Correct = "";

fs.readFile("questions.json","utf-8",(err,data)=>{
  if(err)console.log("Could Not Read Questions");
  else {
      var objList = JSON.parse(data);
      questionObjects = objList;
      console.log(objList.length);
  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  currentQuestion = questionObjects[Math.floor(Math.random() * 546)];
    res.render('questions',{
      Questions: currentQuestion.question,
      Ans1: currentQuestion.A,
      Ans2: currentQuestion.B,
      Ans3: currentQuestion.C,
      Ans4: currentQuestion.D,
      Correctness: Correct
    });
  
});
router.post('/submit', function(req, res, next) {
  // console.log(req.body.Answer);
  // console.log(currentQuestion.answer);
  if(currentQuestion[currentQuestion.answer] === req.body.Answer)Correct = "true";
  else Correct = "false";
  currentQuestion = questionObjects[Math.floor(Math.random() * 546)];
    res.render('questions',{
      Questions: currentQuestion.question,
      Ans1: currentQuestion.A,
      Ans2: currentQuestion.B,
      Ans3: currentQuestion.C,
      Ans4: currentQuestion.D,
      Correctness: Correct
    });
});


module.exports = router;
