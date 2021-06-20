const { config } = require('dotenv');
const fs=require('fs');
const readline= require('readline');


function generateEnv1(){
    var configInterface=readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    configInterface.question('Enter your Discord bot token: ', botToken => {
        fs.appendFile("./.env",`BOT_TOKEN=${botToken}\n`,()=>{
            configInterface.close();
            generateEnv2();
        });
    });
}



function generateEnv2(){
    var configInterface=readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    configInterface.question('Enter the prefix you want to use: ', prefix =>{
        fs.appendFile("./.env", `COMM_PREFIX=${prefix}\n`, ()=>{
            configInterface.close();
            generateEnv3();
        });
    });
}


function generateEnv3(){
    var configInterface=readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    configInterface.question('Enter your own 18-digit Discord ID: ', adminDiscord=>{
        fs.appendFile("./.env",`ADMIN_ID=${adminDiscord}\n`,()=>{
            configInterface.close();
            generateEnv4();
        });
    });

}


function generateEnv4(){
    var configInterface=readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    configInterface.question('Enter the ID of the text channel for messages: ', fileChannel=>{
        fs.appendFile("./.env",`FILE_CHANNEL=${fileChannel}`,()=>{
            configInterface.close();
            console.log("Properly configured. Go ahead and run the bot.");
            process.exit();
        });
    });

}

console.log(`
______ _ _      ____        _   
|  ____(_) |    |  _ \\      | |  
| |__   _| | ___| |_) | ___ | |_ 
|  __| | | |/ _ \\  _ < / _ \\| __|
| |    | | |  __/ |_) | (_) | |_ 
|_|    |_|_|\\___|____/ \\___/ \\__|
                                
                                
`);
generateEnv1();
