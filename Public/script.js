const main = document.querySelector("main");
const edit = document.querySelector(".edit");
const body = document.querySelector("body");
const operation = document.querySelectorAll(".operation");
const addString = `    <form action="http://localhost:8080/students/" method="POST" class="student-form">
    
    
        <label for="s-id">Student ID : </label>
        <input type="text" id="s-id" name="studentId" placeholder="Enter Student ID" required>

        <label for="roll">Roll Number : </label>
        <input type="text" id="roll" name="rollNo" placeholder="Enter Roll Number" required>

        <label for="s-name">Full Name : </label>
        <input type="text" id="s-name" name="name" placeholder="Enter Student Name" required>

        <label for="f-name">Father's Name : </label>
        <input type="text" id="f-name" name="fatherName" placeholder="Enter Father's Name" required>

        <label for="m-name">Mother's Name : </label>
        <input type="text" id="m-name" name="motherName" placeholder="Enter Mother's Name" required>

        <label for="dob">Date of Birth : </label>
        <input type="date" id="dob" name="dob" required>

        <label for="gender">Gender : </label>
        <select id="gender" name="gender" required>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
        </select>

        <label for="s-num">Mobile Number : </label>
        <input type="tel" id="s-num" name="phone" placeholder="Enter Mobile Number" required>

        <label for="guardian">Guardian Contact : </label>
        <input type="tel" id="guardian" name="parentPhone" placeholder="Enter Guardian Number" required>

        <label for="email">Email Address : </label>
        <input type="email" id="email" name="email" placeholder="Enter Email" required>

        <label for="address" >Address : </label>
        <input type="text" id="address" name="address" placeholder="Enter Address" rows="3" required></input>

        <label for="course">Course : </label>
        <select id="course" name="course" required>
            <option value="">Select Course</option>
            <option value="b.tech">B.Tech</option>
            <option value="m.tech">M.Tech</option>
            <option value="bba">BBA</option>
            <option value="mba">MBA</option>
            <option value="mca">MCA</option>
            <option value="bca">BCA</option>
        </select>

        <label for="branch">Branch : </label>
        <input type="text" id="branch" name="branch" placeholder="Ex: B.tech">

        <div>
            <label>Year : </label>
            <label><input type="radio" name="year" value="1" required> 1st </label>
            <label><input type="radio" name="year" value="2"> 2nd </label>
            <label><input type="radio" name="year" value="3"> 3rd </label>
            <label><input type="radio" name="year" value="4"> 4th </label>
        </div>

        <label for="admission">Admission Date : </label>
        <input type="date" id="admission" name="admissionDate" required>

        <label for="blood">Blood Group : </label>
        <input type="text" id="blood" name="bloodGroup" placeholder="Ex: O+" >

        

        <button type="submit">Register Student</button>
    </form>`
const getString = `
    <div class="option-box">
        <label>
            <input type="radio" name="view" value="one" class="one">
            View One
        </label>

        <label>
            <input type="radio" name="view" value="many" class="many">
            View Many
        </label>
    </div>
    `; 
const getString2 = `
<select id="view-course" name="course" required>
    <option value="">Select Course</option>
    <option value="b.tech">B.Tech</option>
    <option value="m.tech">M.Tech</option>
    <option value="bba">BBA</option>
    <option value="mba">MBA</option>
    <option value="mca">MCA</option>
    <option value="bca">BCA</option>
</select>
<select id="view-year" name="year" required>
    <option value="">Select Year</option>
    <option value="1">1st</option>
    <option value="2">2nd</option>
    <option value="3">3rd</option>
    <option value="4">4th</option>
</select>

<button type="search" class="search-btn">Submit</button>`;
const replaceString = `
<div>
    <input type="text" placeholder="Enter Student Id">
    <button>Search</button>
</div>
`
let editWindow ;



addEventListener("click",(e)=>{
    if(e.target.classList.contains("operation") || e.target.parentElement.classList.contains("operation")){
        let op;
        if(e.target.classList.contains("operation")){
            target = e.target;
            op = target.getAttribute('id');
        }
        else{
            target = e.target.parentElement;
            op = target.getAttribute('id');
        }
        changeWindow(op);
        
    }
});

function changeWindow(op){
    editWindow = String(main.innerHTML);
    main.innerHTML = "";
    const taskWindow = document.createElement("div");
    taskWindow.classList.add("taskWindow");
    const title = document.createElement("h3");
    title.innerHTML = op;
    taskWindow.append(title);
    main.append(taskWindow);
    switch(op){
        case "add":
            taskWindow.innerHTML += addString;
            break;
        case "replace":
        case "delete":
        case "update":
            taskWindow.append(inputBox());
            taskWindow.append(displayWindow());
            break;
        case "get":
            taskWindow.innerHTML += getString;
            break;

        case "other":
            replaceWindow(taskWindow);
            break;
    }
}

// function to adding input box in each
function inputBox(){
    let inputBar = document.createElement("div");
    inputBar.classList.add("input-bar");
    let input = document.createElement("input");
    input.type = "text";
    input.classList.add("search-space")
    input.placeholder = "Enter Student Id";
    let button = document.createElement("button");
    button.setAttribute("id","s-btn");
    let img = document.createElement("img");
    img.src = "./icons/loupe.png";
    img.style.height = "20px";
    button.append(img);
    button.classList.add("search-btn");
    inputBar.append(input,button);
    return inputBar;
}

// function to create display window
function displayWindow() {
    let displayStudents = document.createElement("div");
    displayStudents.classList.add("display-students");
    return displayStudents;
}


let viewCheck = 0;
// function for view student window 
document.addEventListener("click", (e) => {
    if (e.target.name == "view") {
        const target = e.target;
        const taskWindow = target.closest(".taskWindow");

        // remove old input-bar
        const oldInputBar = taskWindow.querySelector(".input-bar");
        if (oldInputBar) oldInputBar.remove();

        // remove old display window
        const oldDisplay = taskWindow.querySelector(".display-students");
        if (oldDisplay) oldDisplay.remove();

        // create new input-bar
        let inputBar = document.createElement("div");
        inputBar.classList.add("input-bar");

        if (target.value === "one"){     
            inputBar = inputBox();
            viewCheck = 1;
        }
        else {   
            inputBar.innerHTML = getString2;
            viewCheck = 2;
        }

        taskWindow.append(inputBar);

        // append display window below search bar
        taskWindow.append(displayWindow());
    }
});

// function for find method 
function getMethod(e){
    const taskWindow = e.target.closest(".taskWindow");
    const heading = taskWindow.querySelector("h3");
    const method = heading.innerText;
    return method;
}

// funtion for all search 
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".search-btn");
    if (!btn) return;

    const method = getMethod(e);
    const taskWindow = e.target.closest(".taskWindow");
    const inputBar = taskWindow.querySelector(".input-bar");

    let data;

    try {
        switch (method) {
            case "get":
                if (viewCheck === 0) return;

                if (viewCheck === 1) {
                    data = await getStudent(inputBar);
                } else {
                    data = await getStudents(inputBar);
                }

                printStudents(data, "get");
                break;

            case "replace":
                data = await getStudent(inputBar);
                printStudents(data, "patch");
                break;

            case "update":
                data = await getStudent(inputBar);
                printStudents(data, "put");
                break;

            case "delete":
                data = await getStudent(inputBar);
                printStudents(data, "delete");
                break;
        }
    } catch (err) {
        console.log(err);
    }
});



const taskWindow = document.querySelector(".taskWindow");

// common print function
function printStudents(data, method = "get") {
    method = method.toLowerCase();

    const box = document.querySelector(".display-students");
    box.innerHTML = "";

    let imgURL;

    switch (method) {
        case "get":
            imgURL = "./icons/002-research.png";
            break;
        case "put":
            imgURL = "./icons/003-replace.png";
            break;
        case "patch":
            imgURL = "./icons/002-update.png";
            break;
        case "delete":
            imgURL = "./icons/001-delete.png";
            break;
        default:
            imgURL = "./icons/default.png";
    }

    console.log(data);
    const students = Array.isArray(data) ? data : [data];
    console.log(students);
    students.forEach(student => {
        const card = document.createElement("div");
        card.classList.add("student-card");
        
        const photo = document.createElement("img");
        photo.src = "./icons/contact.png";
        photo.classList.add("student-photo");

        const personalInfo = document.createElement("div");
        personalInfo.classList.add("personal-info");

        const name = document.createElement("h4");
        name.innerHTML = student.name;

        const rollNo = document.createElement("div");
        rollNo.innerHTML = student.rollNo;

        const email = document.createElement("div");
        email.innerHTML = student.email;

        const button = document.createElement("button");
        button.classList.add("student-card-btn");

        const img = document.createElement("img");
        img.src = imgURL;

        button.append(img);

        personalInfo.append(name, rollNo, email)
        card.append(photo,personalInfo,button);
        box.append(card);
    });
}



const BASE_URL = "http://localhost:8080/students/";

// GET all
async function getStudents(inputBar) {
    const course = inputBar.querySelector("#view-course").value;
    const year = inputBar.querySelector("#view-year").value;

    try {
        const finalURL = `${BASE_URL}?course=${course}&year=${year}`;
        const res = await fetch(finalURL);
        const data = await res.json();

        return data;   // important
    } catch (err) {
        console.log(err);
        return [];
    }
}

// GET one
async function getStudent(inputBar) {
    const id = inputBar.querySelector("input").value;

    try {
        const res = await fetch(`${BASE_URL}${id}`);
        const data = await res.json();

        // if backend returns array -> first element
        const student = Array.isArray(data) ? data[0] : data;

        return student;
    } catch (err) {
        console.log(err);
    }
}

