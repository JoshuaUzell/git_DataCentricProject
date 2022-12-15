const express = require('express')
const app = express()
const pmysql = require('promise-mysql')
const ejs = require('ejs');
const bodyParser = require('body-parser') 

var pool;
var employeesList = []

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false })) 

pmysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'proj2022'
})
    .then((p) => { //Resolved promise runs this code (brackets around p not needed, just for clarity)
        pool = p
    })
    .catch((e) => { //If not, error occurs (brackets around e not needed, just for clarity)
        console.log("pool error:" + e)
    })

// A GET request that is made to the homepage
app.get('/', (req, res) => {
    console.log("GET received")
    res.send("<a href='/employees'>Employees</a>"
        + "<br><a href='/employees'>Departments</a>"
        + "<br><a href='/employees'>Employees(MongoDB)</a>"
        + "<br><a href='/test'>TEST(Remove at end of project)</a>")
})

// A GET request that is made to the employees page
app.get('/employees', (req, res) => {

    // Execute a mySQL query using the connection pool
    pool.query('SELECT * FROM employee')
        .then(results => {
            employeesList = results
            // Render an EJS template with the data from the query
            res.render('employees', { employees: results })
        })
        .catch(error => {
            // Handle any errors that occurred
            console.error(error);
            pool.end();
        });
})

//Used when updating the employee
app.get('/employees/edit/:eid', (req, res) => {

    var employee = employeesList.find((employee) => {
        if(employee.eid == req.params.eid){
            return employee
        }
    })

    if(employee != undefined){
        res.render('editEmployee', {
            employeeID: employee.eid,
            employeeSalary: employee.salary,
            employeeName: employee.ename,
            employeeRole: employee.role,
        })
    }else{
        res.send("Error " + req.params.eid + " Not Found")
    }
})

//POST REQUEST
app.post('/employees/edit/:eid', (req, res) => {
   
    console.log("Post request made")
    console.log(req.body.name)

    var employee = employeesList.find((employee) => {
        if(employee.eid == req.params.eid){
            return employee
        }
    })

    if(req.body.name.length < 4){
        res.render('editEmployee', {
            employeeID: employee.eid,
            employeeSalary: employee.salary,
            employeeName: employee.ename,
            employeeRole: employee.role,
        })
    }else{
        res.redirect('/employees')
    }

    
})

//This get method is used for testing
app.get('/test', (req, res) => {
    res.render('testTable', {
        data: 2,
        searchArray: ['Tom', 'Jerry', 'Peter']
    })
})

// A GET request that is made to the departments page
app.get('/depts', (req, res) => {
    console.log("GET received")
    res.send("<h1>Departments</h1>")

    //NOTE**
    //Insert employees table from employeesDB.sql 

})

// A GET request that is made to the employees(mongoDB) page
app.get('/employeesMongoDB', (req, res) => {
    console.log("GET received")
    res.send("<h1>Employees (MongoDB)</h1>")

    //NOTE**
    //Insert from MongoDB 

})

//Listens on port 3000
app.listen(3000, () => {
    console.log("Listening on port 3000")
})

