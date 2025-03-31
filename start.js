var fs = require('fs');

fs.readFile("questions.json","utf-8",(err,data)=>{
    if(err)console.log("Could Not Read Questions");
    else {
        var objList = JSON.parse(data);
        console.log(objList[0].question);
    }
});