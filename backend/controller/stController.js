const Student = require('../model/stModel');

exports.getStudents = async (req, res) => {
    console.log(req.params.id);
    let studentId = req.params.id;
    let year ;
    let course ;
    year = req.query.year;
    course = req.query.course;

    if (studentId) {
        studentId = studentId.toUpperCase();
        const student = await Student.find({studentId:{$eq:studentId}});
        res.json(student);
    } 
    else if(year && course){
        const student = await Student.find({year:{$eq:year},course:{$eq:course}});
        res.json(student);
    }
    else {
        res.status(400).json({
            message: "Bad Request"
        });
    }
};

exports.postStudents = async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
    
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.putStuedents = async (req,res)=>{
  try {
    let studentId = req.params.id;
    studentId = studentId.toUpperCase();
    const student = new Student(req.body);
    
    await Student.findOneAndReplace({studentId:{$eq:studentId}},student,{new:true});
    res.status(201).json(student);
    
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}

exports.patchStudents = async (req,res)=>{
  try {
    let studentId = req.params.id;
    studentId = studentId.toUpperCase();
    const patchSet = req.body;
    await Student.findOneAndUpdate({studentId:{$eq:studentId}},patchSet);
    res.status(201).json({"status":"updated"});

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}

exports.deleteStudents = async (req,res)=>{
  try {
    let studentId = req.params.id;
    studentId = studentId.toUpperCase();
    const patchSet = req.body;
    const student = await Student.findOneAndDelete({studentId:{$eq:studentId}});
    res.status(201).json(student);
    
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
} 



