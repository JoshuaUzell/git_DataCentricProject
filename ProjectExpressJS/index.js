const express = require('express')
const app = express()
const pmysql = require('promise-mysql')
const ejs = require('ejs');
const bodyParser = require('body-parser')

var pool;
var employeesList = []

//Error variables
var eidErrorVisiblity = "hidden"
var nameErrorVisiblity = "hidden"
var roleErrorVisiblity = "hidden"
var salaryErrorVisibilty = "hidden"

//Boolean for employee error
var hasEidErrorOccured = false
var hasNameErrorOccured = false
var hasRoleErrorOccured = false
var hasSalaryErrorOccured = false

//Role strings used for error checking of roles for employees
var managerRole = "Manager"
var employeeRole = "Employee"

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

    //Sets Error values to false when user is on homepage
    hasEidErrorOccured = false
    hasNameErrorOccured = false;
    hasRoleErrorOccured = false
    hasSalaryErrorOccured = false

    //Set error strings to hidden when on homepage
    eidErrorVisiblity = "hidden"
    nameErrorVisiblity = "hidden"
    roleErrorVisiblity = "hidden"
    salaryErrorVisibilty = "hidden"

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

//GET REQUEST
app.get('/employees/edit/:eid', (req, res) => {

    var employee = employeesList.find((employee) => {
        if (employee.eid == req.params.eid) {
            return employee
        }
    })

    if (employee != undefined) {
        res.render('editEmployee', {
            employeeID: employee.eid,
            employeeSalary: employee.salary,
            employeeName: employee.ename,
            employeeRole: employee.role,
            isHidingEidError: eidErrorVisiblity,
            isHidingNameError: nameErrorVisiblity,
            isHidingRoleError: roleErrorVisiblity,
            isHidingSalaryError: salaryErrorVisibilty
        })
    } else {
        res.send("Error " + req.params.eid + " Not Found")
    }
})

//POST REQUEST
app.post('/employees/edit/:eid', (req, res) => {

    var employee = employeesList.find((employee) => {
        if (employee.eid == req.params.eid) {
            return employee
        }
    })

    //Check if Eid has changed
    if (req.body.eid != req.params.eid) {
        eidErrorVisiblity = "visible"
        hasEidErrorOccured = true
    } else {
        eidErrorVisiblity = "hidden"
        hasEidErrorOccured = false
    }

    //Check if Name is less than 5 characters
    if (req.body.name.length < 4) {
        nameErrorVisiblity = "visible"
        hasNameErrorOccured = true
    } else {
        nameErrorVisiblity = "hidden"
        hasNameErrorOccured = false
    }
    
    //Check if Role is equal to Manager or Employee 
    if (!req.body.role.localeCompare(managerRole) || !req.body.role.localeCompare(employeeRole)) {
        roleErrorVisiblity = "hidden"
        hasRoleErrorOccured = false
    } else {
        roleErrorVisiblity = "visible"
        hasRoleErrorOccured = true
    }

    //Check if Salary is greater than 0
    if (req.body.salary <= 0) {
        salaryErrorVisibilty = "visible"
        hasSalaryErrorOccured = true
    } else {
        salaryErrorVisibilty = "hidden"
        hasSalaryErrorOccured = false
    }



    if (hasEidErrorOccured || hasNameErrorOccured || hasRoleErrorOccured || hasSalaryErrorOccured) {
        res.render('editEmployee', {
            employeeID: employee.eid,
            employeeSalary: employee.salary,
            employeeName: employee.ename,
            employeeRole: employee.role,
            isHidingEidError: eidErrorVisiblity,
            isHidingNameError: nameErrorVisiblity,
            isHidingRoleError: roleErrorVisiblity,
            isHidingSalaryError: salaryErrorVisibilty
        })
    } else {
        //Insert code into SQL database here
        var myQuery = {
            sql: 'update employee set ename = ?, role = ?, salary = ? where eid = ?',
            values: [req.body.name, req.body.role, req.body.salary, req.body.eid]
        }
        pool.query(myQuery)
            .then((data) => {
                console.log(data)
            })
            .catch(error => {
                console.log(error)
            })

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

