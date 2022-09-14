
require('dotenv').config();
const db         = require('./config/database');
const express    = require('express');
const UssdMenu   = require('ussd-builder');
const TicketData = require('./model/model')
db.connect()

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended:true }));


let menu = new UssdMenu();

let dataToSave = {}

const atCredentials = {
    apiKey  : process.env.AT_SANDBOX_APIKEY,
    username: process.env.AT_SANDBOX_USERNAME
}

const AfricasTalking = require('africastalking')(atCredentials)

const sms = AfricasTalking.SMS
const payments = AfricasTalking.PAYMENTS

menu.startState({
    run: () =>{
        menu.con('Welcome! Ready to register for the ZIZI conference: ' + '\n1. Get Started ' + '\n2. Get Out!');
    },
    next:{
        '1': 'register',
        '2': 'quit'
    }
});

menu.state('register', {
    run: () =>{
        menu.con('Before we go ahead, what is your name?')
    },
    next: {
        '*[a-zA-Z]+': 'register.tickets'
    }
});

menu.state('register.tickets', {
    run: () => {
        let name = menu.val;
        dataToSave.name = name;
        console.log(dataToSave);
        
        menu.con('How many tickets would you like to reserve');

    },

    next: {
        // using regex to match user input to net state

        '*\\d+': 'end'
    }
});

menu.state('end', {
    run: async () =>{
        let tickets = menu.val;
        dataToSave.tickets = tickets;
        console.log(dataToSave);

        // save data
        const data = new TicketData({
            name   : dataToSave.name,
            tickets: dataToSave.tickets
        });

        const dataSaved = await data.save();

        const options = {
            to     : menu.args.phoneNumber,
            message: `Hi ${dataToSave.name}, we've reserved ${dataToSave.tickets} tickets for you`
        }

        await sms.send(options)
                .then( response =>{
                    console.log(response)
                })
                .catch( error => {
                    console.log(error)
                })

        menu.end('Awesome! We have you tickets reserved. sending a confrimation text shortly')
    }
});

menu.state('quit', {
    run: () =>{
        menu.end("Goodbye")
    }
})

app.post('/ussd', (req, res)=>{
    menu.run(req.body, ussdResult => {
        res.send(ussdResult)
    })
})




app.listen(3000, async () => console.log('App running on port 3000'));
