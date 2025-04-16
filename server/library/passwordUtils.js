const crypto = require('crypto')

/*
checks if password provided meets all the necessary requirements to be used as a user password
to pass password must have the following characteristics:
    at least 6 characters long
    at most 45 characters long
    at least one lowercase letter
    at least one uppercase letter
    at least one number
    at least one special character

expected input:
    password = string

return:
    bool
*/
function validPassword(password) {
    if (password.length < 6 || password.length > 45) {
        return false;
    }

    const checks = [
        /[a-z]/,       // at least one lowercase letter
        /[A-Z]/,       // at least one uppercase letter
        /[0-9]/,       // at least one number
        /[!@#$%^&*]/   // at least one special character
    ];
    
    // check if password meets all requirements, return result
    return checks.every(regex => regex.test(password));
}

/*
checks if password provided matches the hashed password once salt and hash have been added

expected input:
    password = string
    hash = string
    salt = string

return:
    bool
*/
function correctPassword(password, hash, salt) {
    var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
    return hash === hashVerify
}

/*
generates salt and hashed password for provided password

expected input:
    password = int

returns:
    {
        salt: string
        hash: string
    }
*/
function encryptPassword(password){
    var salt = crypto.randomBytes(32).toString('hex')
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

    return {
        salt: salt,
        hash: genHash
    }
}

module.exports = {
    validPassword,
    correctPassword,
    encryptPassword
}