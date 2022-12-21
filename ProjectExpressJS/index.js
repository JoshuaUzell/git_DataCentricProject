//Imports for the project
const express = require('express')
const app = express()
const pmysql = require('promise-mysql')
const ejs = require('ejs');
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

//Creates a pool for mySQL
var pool;

//Array lists for the employeesSQL and MongoDB databases
var employeesList = []
var employeesMongoDBList = []

//Employee Error variables for visiblity 
var eidErrorVisiblity = "hidden"
var nameErrorVisiblity = "hidden"
var roleErrorVisiblity = "hidden"
var salaryErrorVisibilty = "hidden"

//Boolean for employee errors
var hasEidErrorOccured = false
var hasNameErrorOccured = false
var hasRoleErrorOccured = false
var hasSalaryErrorOccured = false

//Employee Mongo Error variables for visiblity 
var eidMongoErrorVisiblity = "hidden"
var phoneErrorVisiblity = "hidden"
var emailErrorVisiblity = "hidden"

//Boolean for employee Mongo errors
var hasErrorMongoEidOccured = false
var hasPhoneErrorOccured = false
var hasErrorEmailErrorOccured = false

//Role strings used for error checking of roles for employees
var managerRole = "Manager"
var employeeRole = "Employee"

//Sets up the view engine and the body-parser 
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))

//Connects to MongoDB database
MongoClient.connect('mongodb://localhost:27017')
    .then((client) => {
        db = client.db('employeesDB')
        coll = db.collection('employees')
    })
    .catch((error) => {
        console.log(error.message)
    })

//Creates a pool for mySQL - no password as this app uses WAMP
pmysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'proj2022'
})
    .then((p) => { //Resolved promise runs this code 
        pool = p
    })
    .catch((e) => { //If not, error occurs
        console.log("pool error:" + e)
    })

//GET REQUEST that is made to the homepage
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

    //Set Error booleans to false
    hasErrorMongoEidOccured = false
    hasPhoneErrorOccured = false
    hasErrorEmailErrorOccured = false

    //Set Mongo Error Strings to be hidden on homepage
    eidMongoErrorVisiblity = "hidden"
    phoneErrorVisiblity = "hidden"
    emailErrorVisiblity = "hidden"

    //Links to the different pages of the project
    res.send("<a href='/employees'>Employees</a>"
        + "<br><a href='/depts'>Departments</a>"
        + "<br><a href='/employeesMongoDB'>Employees(MongoDB)</a>")
})

//GET REQUEST that is made to the employees page
app.get('/employees', (req, res) => {

    // Execute a mySQL query using the connection pool
    pool.query('SELECT * FROM employee')
        .then(results => {
            employeesList = results
            // Render an EJS template with the data from the query
            res.render('employees', { employees: employeesList })
        })
        .catch(error => {
            // Handle any errors that occurred
            console.error(error);
            pool.end();
        });
})

//GET REQUEST for employee edit page
app.get('/employees/edit/:eid', (req, res) => {

    //Checks if the url eid is the same as the employees eid in mySQL
    //If so, return the employee
    var employee = employeesList.find((employee) => {
        if (employee.eid == req.params.eid) {
            return employee
        }
    })

    //If an employee with the same eid was found earlier, display edit page to the user
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

//POST REQUEST for employee edit page
app.post('/employees/edit/:eid', (req, res) => {

    //If an employee eid is the same as the url eid, return the employee
    var employee = employeesList.find((employee) => {
        if (employee.eid == req.params.eid) {
            return employee
        }
    })

    //Check if Eid has changed, and if so show the error message
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

    //Check if Role is not equal to Manager or Employee 
    if (!req.body.role.localeCompare(managerRole) || !req.body.role.localeCompare(employeeRole)) {
        roleErrorVisiblity = "hidden"
        hasRoleErrorOccured = false
    } else {
        roleErrorVisiblity = "visible"
        hasRoleErrorOccured = true
    }

    //Check if Salary is less than 0, if so display error
    if (req.body.salary <= 0) {
        salaryErrorVisibilty = "visible"
        hasSalaryErrorOccured = true
    } else {
        salaryErrorVisibilty = "hidden"
        hasSalaryErrorOccured = false
    }

    //IF there are still any error messages, display them to the user
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
        //Insert employee into SQL database 
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

//GET REQUEST that is made to the departments page
app.get('/depts', (req, res) => {

    // Execute a mySQL query using the connection pool
    pool.query('SELECT * FROM dept')
        .then(results => {
            // Render an EJS template with the data from the query
            res.render('departments', { departments: results })
        })
        .catch(error => {
            // Handle any errors that occurred
            console.error(error);
            pool.end();
        });

})

//GET REQUEST for departments/delete page
app.get('/depts/delete/:did', (req, res) => {

    //Execute a mySQL query using the connection pool
    pool.query('Select * from emp_dept')
        .then(results => {
            var empDepartment = results.find((empDept) => {
                if (empDept.did == req.params.did) {
                    return empDept
                }
            })

            //If there is already a department associated with an employee, send error message saying it cannot be deleted
            if (empDepartment != undefined) {
                res.send(`<h1>Error Message<h1>\n <h2>Department ${req.params.did} has employees and cannot be deleted</h2>
                <a href="/">Home</a>`)
            } else {
                //Delete the department from the mySQL database
                var myQuery = {
                    sql: 'delete from dept where did = ?',
                    values: [req.params.did]
                }
                pool.query(myQuery)
                    .then((data) => {
                        console.log(data)
                    })
                    .catch(error => {
                        console.log(error)
                    })
                res.redirect('/depts')
            }

        })
        .catch(error => {
            // Handle any errors that occurred
            console.error(error);
            pool.end();
        });

})

//GET REQUEST that is made to the employees(mongoDB) page
app.get('/employeesMongoDB', (req, res) => {

    //Finds all the employees in the Mongo Database and displays them on the page
    var cursor = coll.find()
    cursor.toArray()
        .then((results) => {
            employeesMongoDBList = results //stores the results in the an array for later use

            // Render an EJS template with the data from the query
            res.render('employeesMongoDB', { mongoEmployees: results })
        })
        .catch((error) => {
            res.render("Error occured")
        })

})

//GET REQUEST for employeeMongo add page
app.get('/employeesMongoDB/add', (req, res) => {

    //Execute a mySQL query using the connection pool 
    //so when the user enters employeeMongo for first time
    //The employeesList will contain all sql employees when checking if the mySql eid is unique
    pool.query('SELECT * FROM employee')
        .then(results => {
            employeesList = results
        })
        .catch(error => {
            // Handle any errors that occurred
            console.error(error);
            pool.end();
        });

    //Render ejs file of addEmployee.ejs here
    res.render('addEmployee', {
        isEidMongoErrorVisible: eidMongoErrorVisiblity,
        isPhoneErrorVisible: phoneErrorVisiblity,
        isEmailErrorVisible: emailErrorVisiblity
    })
})

//POST REQUEST for employeeMongo add page
app.post('/employeesMongoDB/add', (req, res) => {

    //Checking if an employee in the mongo database has the same
    //eid, return that employee
    var mongoEmpWithSameEid = employeesMongoDBList.find((employee) => {
        if (employee._id == req.body.eid) {
            return employee
        }
    })

    //Checking if an employee in the sql database has the same
    //eid, return that employee
    var sqlEmpWithSameEid = employeesList.find((employee) => {
        if (employee.eid == req.body.eid) {
            console.log("Sql employee found")
            return employee
        } else {
            console.log("Sql employee not found")
        }
    })

    //Check if the eid is less than 4 characters
    if (req.body.eid.length < 4) {
        eidMongoErrorVisiblity = "visible"
        hasErrorMongoEidOccured = true
    } else {
        eidMongoErrorVisiblity = "hidden"
        hasErrorMongoEidOccured = false

    }

    //Check if phone number less than or equal to 5 characters
    if (req.body.phone.length <= 5) {
        phoneErrorVisiblity = "visible"
        hasPhoneErrorOccured = true
    } else {
        phoneErrorVisiblity = "hidden"
        hasPhoneErrorOccured = false
    }

    //Check if mongo employee email is valid
    //Reference: https://www.educba.com/email-validation-in-javascript/ 
    if (!checkMyMailAddress(req.body.email)) {
        emailErrorVisiblity = "visible"
        hasErrorEmailErrorOccured = true
    } else {
        emailErrorVisiblity = "hidden"
        hasErrorEmailErrorOccured = false
    }

    //Check if there are any errors, display them to user
    //Else if eid already exits in the Mongo database, display MongoDB error
    //Else if the eid doesn't exist in the mySQL database, display mySQL error
    //Otherwise if there are no errors, add a new employee document to the mongoDB database
    if (hasErrorMongoEidOccured || hasPhoneErrorOccured || hasErrorEmailErrorOccured) {
        res.render('addEmployee', {
            isEidMongoErrorVisible: eidMongoErrorVisiblity,
            isPhoneErrorVisible: phoneErrorVisiblity,
            isEmailErrorVisible: emailErrorVisiblity
        })
    } else if (mongoEmpWithSameEid != undefined) {
        res.send(`<h1>Error Message<h1>\n <h2>Error EID ${req.body.eid} already exists in MongoDB</h2>
                <a href="/">Home</a>`)
    } else if (sqlEmpWithSameEid == undefined) {
        res.send(`<h1>Error Message<h1>\n <h2>Employee ${req.body.eid} doesn't exist in MySQL DB</h2>
                <a href="/">Home</a>`)
    } else {

        const employeeDocument = { _id: req.body.eid, phone: req.body.phone, email: req.body.email }
        coll.insertOne(employeeDocument)
            .then((results) => {
                console.log(results)
                console.log("Successful adding of employee!")
                res.redirect("/employeesMongoDB")
            })
            .catch((error) => {
                res.render("Error occured")
            })
    }
})

//Checks if email is valid - 
//Reference: https://www.educba.com/email-validation-in-javascript/
function checkMyMailAddress(HTMLText) {
    var validate = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (HTMLText.match(validate)) {
        return true;
    } else {
        return false;
    }
}

//Listens on port 3000
app.listen(3000, () => {
    console.log("Listening on port 3000")
})

