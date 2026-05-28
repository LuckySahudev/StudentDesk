const path = require('path');
const fs = require('fs');
const pageURL = path.resolve(__dirname,'../../pages/teacher.html')
const page = fs.readFileSync(pageURL,"utf-8");

exports.getpage = (req,res)=>{
    res.send(page);
}