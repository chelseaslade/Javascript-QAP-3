const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { error } = require("console");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my_secure_key",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "AdminUser",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  const errorMessage = request.query.error || null;
  response.render("login", { errorMessage });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
  const { email, password } = request.body;
  const user = USERS.find((user) => user.email === email);

  if (!!user && bcrypt.compareSync(password, user.password)) {
    request.session.username = user.username;
    request.session.role = user.role;
    request.session.email = email;
    return response.redirect("/landing");
  }

  //Error logging in, redirect back to login with error message
  return response
    .status(400)
    .redirect("/login?error=Invalid username or password.");
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  const errorMessage = request.query.error || null;
  response.render("signup", { errorMessage });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  const { username, email, password } = request.body;
  if (USERS.find((user) => user.username === username)) {
    return response
      .status(400)
      .render("signup", { errorMessage: "Username not available." });
  }
  USERS.push({
    username,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    email,
  });
  console.log("New user added!");
  return response.redirect("/");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  const userEmail = request.session.email;
  const errorMessage = request.query.error || null;

  if (request.session.username) {
    return response.redirect("/landing");
  }

  response.render("index", { userEmail, errorMessage });
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  const username = request.session.username;
  const role = request.session.role;

  //Admin page
  if (role === "admin") {
    console.log("User is admin!");

    return response.render("landing", { username, users: USERS });
  }

  //Not admin
  return response.render("landing", { username, users: null });
});

//Logout Page
app.post("/logout", (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      return response.status(500).send("Failed to logout user.");
    }
    response.redirect("/");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
