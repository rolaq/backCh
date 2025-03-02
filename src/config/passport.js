import passport from "passport";
import local from 'passport-local'
import GithubStrategy from 'passport-github'
import jwt from 'passport-jwt'
import userModel from "../models/userModels.js";
import { createHash, validatePassword } from "../utils/bcrypt.js";
import 'dotenv/config'

const localStrategy = local.Strategy
const JWTStrategy = jwt.Strategy
const ExtractJWT = jwt.ExtractJwt

const cookieExtractor = (req) => {
    let token = null
    if(req.cookies) {
        token = req.cookies["coderSession"] 
    }
    
    return token
}


const initializatePassport = () => {
    passport.use('register', new localStrategy({passReqToCallback: true, usernameField: 'email'},async(req,username, password, done) => {
        try {
            const {first_name, last_name, email, password, age} = req.body
    
            if(first_name == undefined || last_name == undefined || email == undefined || password == undefined || age == undefined) {
                return done(null, false)
            } else {
                let user = await userModel.create({
                    first_name: first_name, 
                    last_name: last_name,
                    email: email,
                    password:  createHash(password), 
                    age:  age})
    
                return done(null, user)
            }
    
        } catch(e) {
            return done(e)
        }
    }))

    passport.use('login', new localStrategy({usernameField: 'email'}, async (username, password,done) => {
        try {
            const user = await userModel.findOne({email: username})
            if(user && validatePassword(password, user.password))
                return done(null, user)
            else 
                return done(null, false)
        } catch(e) {
            return done(e)
        }
    }))

    passport.use('github', new GithubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:8080/api/sessions/githubcallback"
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log(accessToken);
            console.log(refreshToken);
            console.log(profile);
            
            let user = await userModel.findOne({email: profile._json.email})
            if(!user) {
                const user = await userModel.create({
                    first_name: profile._json.name || 'Usuario',
                    last_name: " ", 
                    email: profile._json.email || `usuario@gmail.com`, 
                    password: createHash("coder"),
                    age: 18
                })
                done(null, user)
            } else {
                done(null, user)
            }
        } catch (e) {
            console.log(e);
            return done(e)
        }
    }))

    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
        secretOrKey: "coder1234"
    },(jwt_payload, done) => {
        try {
            return done(null, jwt_payload)
        } catch (e) {
            return done(e)
        }
    }))

    passport.serializeUser((user, done) => {
        done(null, user?._id)
    })
    
    passport.deserializeUser(async (id, done) => {
        const user = await userModel.findById(id)
        done(null, user)
    })

}

export default initializatePassport