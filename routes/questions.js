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

function newQuestions(req,res,next){
    currentQuestion = questionObjects[Math.floor(Math.random() * 546)];
      res.render('questions',{
        Questions: currentQuestion.question,
        Ans1: currentQuestion.A,
        Ans2: currentQuestion.B,
        Ans3: currentQuestion.C,
        Ans4: currentQuestion.D,
        Correctness: Correct
      });
}
/* GET users listing. */
router.get('/', newQuestions);

router.post('/submit', function(req, res, next) {
//  console.log(req.body);
//  console.log(currentQuestion.answer); //Problem is here
  if(currentQuestion != null && req.body.Answer != undefined){
    if(currentQuestion[currentQuestion.answer] === req.body.Answer)Correct = "true";
    else Correct = "false";
    newQuestions(req,res,next);
  }
  else {
    Correct = "no answer selected";
    newQuestions(req,res,next);
  }

});


module.exports = router;
