var express = require('express');
var router = express.Router();
var fs = require('fs');
var questionObjects;
var currentQuestion;
var correctNumber = 0;
var questionNumber = 1;
var maxQuestions = 10;
var statusMessage ="";
fs.readFile("questions.json","utf-8",(err,data)=>{
  if(err)console.log("Could Not Read Questions");
  else {
      var objList = JSON.parse(data);
      questionObjects = objList;
      console.log(objList.length);
  }
});

function newQuestions(req,res,next){
    if(next != false){
      currentQuestion = questionObjects[Math.floor(Math.random() * 546)];
      statusMessage = "";
    }
      res.render('questions',{
        QNumber: questionNumber,
        Questions: currentQuestion.question,
        Ans1: currentQuestion.A,
        Ans2: currentQuestion.B,
        Ans3: currentQuestion.C,
        Ans4: currentQuestion.D,
        Status: statusMessage
      });
}

router.get('/', (req,res,next)=>{
  if(req.query.TotalQuestions != '')maxQuestions = req.query.TotalQuestions;
  correctNumber = 0;
  questionNumber = 1;
  newQuestions(req,res,next);
});

router.post('/submit', function(req, res, next) {

  if(currentQuestion != null && req.body.Answer != undefined){
    questionNumber++;
    if(currentQuestion[currentQuestion.answer] === req.body.Answer)correctNumber++;
    if(questionNumber > maxQuestions){
      res.render('result',{
        TotalCorrect: correctNumber
      });
    }
    else newQuestions(req,res,next);
  }
  else {
    statusMessage = "no answer selected";
    newQuestions(req,res,false);
  }

});


module.exports = router;
