const jwt = require('jsonwebtoken')
const { connectDb } = require("./dbConnect")


exports.createUser= (req, res) => {
    // first, do some validation... (email, password)
    if(!req.body || !req.body.email || !req.body.password) {
        // invaild request
        res.status(400).send({
            success: false,
            messaage: 'Invalid Request'
        })
        return
    }
    const newUser = {
        email: req.body.email.toLowerCase(),
        password: req.body.password,
        isAdmin: false,
        userRole: 5,    
    }

    const db = connectDb()
    db.collection('users').add(newUser)
        .then(doc => {
            // this will become the payload for our JWT
            const user = {   
                id: doc.id,
                email:newUser.email,
                isAdmin: false,
                userRole: 5,
            }
            const token = jwt.sign(user, 'doNotShareYourSecret') //protect this secret
            res.status(201).send({
                success: true,
                message: 'Account Created',
                token
            })
        })
        .catch(err => res.status(500).send({
            success: false,
            message: err.message,
            error: err
        }))
}

exports.loginUser = (req, res) => {
    if(!req.body || !req.body.email || !req.body.password) {
        // invaild request
        res.status(400).send({
            success: false,
            messaage: 'Invalid Request'
        })
        return
    }
    const db = connectDb()
    db.collection('users')
    .where('email', '==', req.body.email.toLowerCase())
    .where('password', '==', req. body.password)
    .get()
        .then(snapshot => {
            if(snapshot.empty){
                res.status(401).send({
                    success: false,
                    message: 'Invalid email or password'
                })
                return
            }
            // good login
            const users= snapshot.docs.map(doc => {
                let user = doc.data()
                user.id = doc.id
                user.password= undefined
                return user
            })
            const token = jwt.sign(users[0], 'doNotShareYourSecret') //protect this secret

            res.send({
                success: true,
                message: 'Login successful',
                token
            })
        })
        .catch(err => res.status(500).send({
            success: false,
            message: err.message,
            error: err
        }))

}

exports.getUsers = (req, res) => {
    //first make sure user sent auth token
    if(!req.headers.authorization) {
        return res.status(403).send({
            success: false,
            messaage: 'No authorization token found'
        })
    }
    const decode = jwt.verify(req.headers.authorization, 'doNotShareYourSecret')
    console.log('NEW REQUEST BY:', decode.email)
    if(decode.userRole > 5){
        return res.status(401).send({
            success: false,
            message: ' Not authorized'
        })
    }
    const db= connectDb()
        db.collection('users').get()
        .then(snapshot => {
            const users= snapshot.docs.map(doc => {
                let user = doc.data()
                user.id = doc.id
                user.password= undefined
                return user        
        })
        res.send({
            success: true,
            message:'Users returned',
            users
         })
        })
        .catch(err => res.status(500).send({
            success: false,
            message: err.message,
            error: err
        }))
    
}