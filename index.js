const mysql = require('mysql');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
  host: 'localhost',

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: 'root',

  // Be sure to update with your own MySQL password!
  password: 'password',
  database: 'employeeTrackerDB',
});

connection.connect((err) => {
  if (err) throw err;
  preSearch();
});

function preSearch() {
  inquirer
    .prompt([
      {
        type: "confirm",
        name: "newTeamConfirm",
        message: "Would you like to create a new team?",
      },
    ])
    .then((confirm) => {
      if (confirm.newTeamConfirm == true) {
        runSearch();
      } else {
        process.exit();
      }
    });
}



const runSearch = () => {
  inquirer
    .prompt({
      name: 'action',
      type: 'rawlist',
      message: 'What would you like to do?',
      choices: [
        'View departments',
        'View roles',
        'View employees',
        'Add departments',
        'Add roles',
        'Add employees',
        'Update employee roles'
      ],
    })
    .then((answer) => {
      switch (answer.action) {
        case 'View departments':
          viewDepartments();
          break;

        case 'View roles':
          viewRoles();
          break;

        case 'View employees':
          viewEmployees();
          break;

        case 'Add departments':
          addDepartments();
          break;

        case 'Add roles':
          addRoles();
          break;

          case 'Add employees':
          addEmployees();
          break;

          case 'Update employee roles':
          updateRoles();
          break;

        default:
          console.log(`Invalid action: ${answer.action}`);
          break;
      }
    });
};

const viewDepartments = () => {
  const query = `select name from department order by name`;
  connection.query(query, (err, res) => {
    if(err) throw err;
    console.table(res);
    runSearch();
  })
}

const viewRoles = () => {
  const query = 'select title, salary, department_id from `role` inner join department on role.department_id = department.id order by `title`'
  connection.query(query,(err, res) => {
    if(err) throw err;
      console.table(res);
      runSearch();
  })
}

const viewEmployees = () => {
  const query = 'select employee.first_name, employee.last_name, role.title as `role`, role.salary, department.name as `department`, concat(manager.first_name, " ", manager.last_name) as manager from employee as employee left outer join employee as manager on employee.manager_id = manager.id inner join `role` as role on employee.role_id = role.id inner join department as department on role.department_id = department.id order by employee.first_name, employee.last_name'
  connection.query(query,(err, res) => {
    if(err) throw err;
      console.table(res);
      runSearch();
  })
}

const addDepartments = () => {
  inquirer
    .prompt([{
      name: 'name',
      type: 'input',
      message: 'name of department'
    }])
    .then((res) => {
      const query = `insert into department (name) value ("${res.name}")`;
      connection.query(query,(err) => {
        if(err) throw err;
          console.table(res);
          runSearch();
      })
    })
}

const addRoles = () => {
  let query = `select id, name from department`;
  connection.query(query, (err, res) => {
    if(err) throw err;  
 
  inquirer
    .prompt([{
      name: 'name',
      type: 'input',
      message: 'name of new role'
    },
    {
      name: 'salary',
      type: 'input',
      message: 'what is the salary of this role'
    },
    {
      name: 'department',
      type: 'rawlist',
      message: 'what is the department associated with this role',
      choices: res.map((department) => department.name)
    }
  ])
    .then((answer) => {
      const idHolder = res.findIndex(
        (department) => department.name === answer.department
      )
      const departmentId = res[idHolder].id;
      const query = `insert into \`role\` (title, salary, department_id) values ("${answer.name}", ${answer.salary}, ${departmentId})`;
      connection.query(query,(err) => {
        if(err) throw err;
          console.table(answer);
          runSearch();
      })
    })
  })
}

const addEmployees = () => {
  let query = "select id, title from `role`";
  connection.query(query, (err, res) => {
    if(err) throw err;  
 
  inquirer
    .prompt([{
      name: 'firstname',
      type: 'input',
      message: 'first name of employee'
    },
    {
      name: 'lastname',
      type: 'input',
      message: 'last name of employee'
    },
    {
      name: 'role',
      type: 'rawlist',
      message: 'role of employee',
      choices: res.map((role) => role.title)
    }
  ])
    .then((answer) => {
      const idHolder = res.findIndex(
        (role) => role.title === answer.role
      )
      const roleId = res[idHolder].id;
      addEmployee2(answer.firstname, answer.lastname, roleId)
    })
  })
}
const addEmployee2 = (firstname, lastname, roleId) => {
  let query = "select id, concat(`first_name`, ' ', `last_name`) as fullname from employee"
  connection.query(query, (err, managers) => {
    if (err) throw err
    managers.unshift({id: null, fullname: "none"})
    inquirer
    .prompt([{
      name: 'manager',
      type: 'rawlist',
      message: 'who is the manager of this employee',
      choices: managers.map((manager) => manager.fullname)
    }])
    .then((answer) => {
      const idHolder = managers.findIndex(
        (manager) => manager.fullname === answer.manager
      )
      const managerId = managers[idHolder].id;
      const query = `insert into employee (first_name, last_name, role_id, manager_id) values ("${firstname}", "${lastname}", ${roleId}, ${managerId})`;
      connection.query(query,(err) => {
        if(err) throw err;
          console.table(answer);
          runSearch();
      })
    })
  })
}
const updateRoles = () => {
  let query = "select id, concat(`first_name`, ' ', `last_name`) as fullname from employee"
  connection.query(query, (err, res) => {
    if(err) throw err;  
 
  inquirer
    .prompt([
      {
      name: 'employeename',
      type: 'rawlist',
      message: 'which employee would you like to update',
      choices: res.map((employee) => employee.fullname)
    }
  ])
    .then((answer) => {
      const idHolder = res.findIndex(
        (employee) => employee.fullname === answer.employeename
      )
      const employeeId = res[idHolder].id;
      updateRoles2(employeeId)
    })
  })
}
const updateRoles2 = (employeeId) => {
  let query = "select id, title from `role`";
  connection.query(query, (err, res) => {
    if (err) throw err
    inquirer
    .prompt([{
      name: 'role',
      type: 'rawlist',
      message: 'what is the new role of the employee',
      choices: res.map((role) => role.title)
    }])
    .then((answer) => {
      const roleHolder = res.findIndex(
        (role) => role.title === answer.role
      )
      const roleId = res[roleHolder].id;
      const query = `update employee set role_id = ${roleId} where id = ${employeeId}`;
      connection.query(query,(err) => {
        if(err) throw err;
          console.table(answer);
          runSearch();
      })
    })
  })
}













/*const artistSearch = () => {
  inquirer
    .prompt({
      name: 'artist',
      type: 'input',
      message: 'What artist would you like to search for?',
    })
    .then((answer) => {
      const query = 'SELECT position, song, year FROM top5000 WHERE ?';
      connection.query(query, { artist: answer.artist }, (err, res) => {
        res.forEach(({ position, song, year }) => {
          console.log(
            `Position: ${position} || Song: ${song} || Year: ${year}`
          );
        });
        runSearch();
      });
    });
};

const multiSearch = () => {
  const query =
    'SELECT artist FROM top5000 GROUP BY artist HAVING count(*) > 1';
  connection.query(query, (err, res) => {
    res.forEach(({ artist }) => console.log(artist));
    runSearch();
  });
};

const rangeSearch = () => {
  inquirer
    .prompt([
      {
        name: 'start',
        type: 'input',
        message: 'Enter starting position: ',
        validate(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        },
      },
      {
        name: 'end',
        type: 'input',
        message: 'Enter ending position: ',
        validate(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        },
      },
    ])
    .then((answer) => {
      const query =
        'SELECT position,song,artist,year FROM top5000 WHERE position BETWEEN ? AND ?';
      connection.query(query, [answer.start, answer.end], (err, res) => {
        res.forEach(({ position, song, artist, year }) => {
          console.log(
            `Position: ${position} || Song: ${song} || Artist: ${artist} || Year: ${year}`
          );
        });
        runSearch();
      });
    });
};

const songSearch = () => {
  inquirer
    .prompt({
      name: 'song',
      type: 'input',
      message: 'What song would you like to look for?',
    })
    .then((answer) => {
      console.log(answer.song);
      connection.query(
        'SELECT * FROM top5000 WHERE ?',
        { song: answer.song },
        (err, res) => {
          if (res[0]) {
            console.log(
              `Position: ${res[0].position} || Song: ${res[0].song} || Artist: ${res[0].artist} || Year: ${res[0].year}`
            );
          } else {
            console.error(`No results for ${answer.song}`);
          }
          runSearch();
        }
      );
    });
};

const songAndAlbumSearch = () => {
  inquirer
    .prompt({
      name: 'artist',
      type: 'input',
      message: 'What artist would you like to search for?',
    })
    .then((answer) => {
      let query =
        'SELECT top_albums.year, top_albums.album, top_albums.position, top5000.song, top5000.artist ';
      query +=
        'FROM top_albums INNER JOIN top5000 ON (top_albums.artist = top5000.artist AND top_albums.year ';
      query +=
        '= top5000.year) WHERE (top_albums.artist = ? AND top5000.artist = ?) ORDER BY top_albums.year, top_albums.position';

      connection.query(query, [answer.artist, answer.artist], (err, res) => {
        console.log(`${res.length} matches found!`);
        res.forEach(({ year, position, artist, song, album }, i) => {
          const num = i + 1;
          console.log(
            `${num} Year: ${year} Position: ${position} || Artist: ${artist} || Song: ${song} || Album: ${album}`
          );
        });

        runSearch();
      });
    });
};
*/