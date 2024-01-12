import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "61290990He.",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;
//user object
let currentUser;

let users = [
];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_country WHERE user_id = $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM family_member");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  currentUser = await getCurrentUser();
  console.log("currentUser: \n" + currentUser.name);
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_country (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add === "new"){
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    console.log(currentUserId);
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const newUser = req.body.name;
  const newColor = req.body.color;
  try {
        const result = await db.query(
        "INSERT INTO family_member (name, color) VALUES ($1, $2) RETURNING *", [newUser, newColor]
      );
      currentUserId = result.rows[0].id;
      console.log("current id : " + currentUserId);
      res.redirect("/")
  } catch (err){
    console.log(err + "This member has been added");
    res.render("new.ejs", {error: `Member ${newUser} has been added`});
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
