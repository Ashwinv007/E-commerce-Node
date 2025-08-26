const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("../config/connection"); 
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const database = db.get(); // get the connected db instance
        const usersCollection = database.collection("users");

        // check if user exists
        let user = await usersCollection.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        } else {
          // insert new user
          let newUser = {
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
          };

          const result = await usersCollection.insertOne(newUser);
          return done(null, result.ops ? result.ops[0] : newUser); 
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id); // store id in session
});

passport.deserializeUser(async (id, done) => {
  try {
    const database = db.get();
    const usersCollection = database.collection("users");

    const user = await usersCollection.findOne({ _id: id });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
