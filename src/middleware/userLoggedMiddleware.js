const fs = require('fs');
const path = require('path');
const usersFilePath = path.join(__dirname, '../data/usersDB.json');
const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'))

function userLoggedMiddleware(req, res, next){
    let userInCookie = req.cookies.user
    let userFromCookie = users.filter(user =>user.user == userInCookie)
    res.locals.isLogged = false;
    

    if(userFromCookie){
        req.session.usuario = userInCookie
    }
    // console.log(req.session)
    if(req.session && req.session.usuario != undefined){
        
        res.locals.isLogged = true;
        res.locals.user = req.session.usuario;

    }

    next();
}

module.exports = userLoggedMiddleware; 