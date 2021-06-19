require("dotenv").config();
const {Client, Message, MessageFlags, MessageEmbed, User, MessageAttachment} = require("discord.js");
const {google}= require('googleapis');
const readline = require('readline');
const fs = require('fs');
const request= require('request');

const client= new Client();
client.login(process.env.BOT_TOKEN);
const prefix=process.env.COMM_PREFIX
var rootID="";
var currentID;
var directory;

var parentStack=[];
const adminDiscord=process.env.ADMIN_ID;
const fileChannel=process.env.FILE_CHANNEL;

var oAuth2Client;
var drive;
var files;

const file_folder=0x1F4C1;
const img=0x1F5BC;
const video=0xF39E;
const doc=0x1F4D1;

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = './secrets/token.json';


function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
        if (err){
            return console.error('Error retrieving access token', err);
        }
        oAuth2Client.setCredentials(token);


        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
        });
    });
}


function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);


    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err){ 
            return getAccessToken(oAuth2Client, callback);
        }
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
    });
}


function getRootID(auth) {    
    drive = google.drive({version: 'v3', auth});
    drive.files.get({fileId: "root"}).then(
        (res)=>{
            rootID=res.data.id;
            currentID=res.data.id;
            parentStack.push(rootID);
            console.log('Fetched Drive Root ID');
        },
        (err)=>{
            console.error(err);
        }
    );
}


function getDirectory(current){
    drive.files.list({
        q: `'${current}' in parents`,
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, ownedByMe, mimeType, webViewLink, webContentLink, size)',
    }, (err, res) => {
        if (err){
            return console.log('The API returned an error: ' + err);
        }
        directory = res.data.files;
        if (directory.length) {
            directory=directory.filter(
                (file)=> {
                    return file.ownedByMe;
                });
            files=directory;
            prepareMessage(directory);
        } 
        else {
            console.log('No files found.');
        }
        currentID=current;
        if(currentID!=rootID){
            parentStack.push(currentID);    
        }
    });
}


function prepareMessage(files){
    var description="```Directory: ";
    files.map(
        (file)=>{
            description+="\n";
            if(file.mimeType.startsWith("image")){
                description+=String.fromCodePoint(img)+" ";
            }
            else if(file.mimeType.substring(file.mimeType.length-6)=="folder"){
                description+=String.fromCodePoint(file_folder)+" ";
            }
            else if(file.mimeType.startsWith("video")){
              description+=String.fromCodePoint(video)+" ";
            }
            else{
                description+=String.fromCodePoint(doc)+" ";
            }
            description+=file.name;
        });
    description+="```";
    client.channels.resolve(fileChannel).send(description);
}


function getCommands(content){

    content=content.substring(prefix.length);
    content=content.trim();
    const args=content.split(" ");
    const command=args[0];
    args.splice(0,1);

    return[command,args];
}


function resolveID(fileName,files){
    var current;
    for(var i=0; i<files.length;i++){
        if(fileName==files[i].name && files[i].mimeType.substring(files[i].mimeType.length-6)=="folder"){
            current=files[i].id;
        }
    }
    if(!current){
        client.users.resolve(adminDiscord).send("Kindly check the name of the file you have entered!");
        return;
    }
    else{
        getDirectory(current);
    }
}


function reverseTraverse(){
    parentStack.pop();
    if(parentStack.length==0){
        currentID=rootID;
        parentStack.push(rootID);
    }
    else{
        currentID=parentStack[parentStack.length-1];
    }
    reverseDirectory(currentID);
}

function reverseDirectory(current){
    drive.files.list({
        q: `'${current}' in parents`,
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, ownedByMe, mimeType ,webViewLink, webContentLink, size)',
    }, (err, res) => {
        if (err){
            return console.log('The API returned an error: ' + err);
        }
        directory = res.data.files;
        if (directory.length) {
            directory=directory.filter(
                (file)=> {
                    return file.ownedByMe;
                });
            files=directory;
            prepareMessage(directory);
        } 
        else {
            console.log('No files found.');
        }
    });
}


function resolveShareLink(fileName,files){
    var file;
    var shareLink;
    for(var i=0;i<files.length;i++){
        if(fileName==files[i].name){
            file=files[i];
            break;
        }
    }
    if(file){
        drive.permissions.create({
            fileId: `${file.id}`,
            requestBody:{
                role: 'reader',
                type: 'anyone'
            }
        }).then(
            (res)=>{
                if(file.webContentLink){
                    shareLink=file.webContentLink;
                }
                else{
                    shareLink=file.webViewLink;
                }
                client.channels.resolve(fileChannel).send(shareLink);
            },
            (reason)=>{
                console.error(reason);
            }
        );
    }
    else{
        client.channels.resolve(fileChannel).send("File not found. Kindly check the name of the file and retry.");
    }
}


function downloadFile(fileName,files){
    var file;
    for(var i=0;i<files.length;i++){
        if(fileName==files[i].name){
            file=files[i];
            break;
        }
    }
    if(file){
        if(file.size<8388608){
            var dest = fs.createWriteStream(`./temp/${file.name}`);
            var stream=drive.files.get(
                {
                    fileId: `${file.id}`, 
                    alt: 'media'
                },  
                {
                    responseType: 'stream'
                },
                function(err, res){
                    res.data
                    .on('end', () => {})
                    .on('error', err => {
                        console.log('Error', err);
                    })
                    .pipe(dest).on('finish', ()=>{
                        client.channels.resolve(fileChannel).send("Download completed");
                        var read=fs.createReadStream(`./temp/${file.name}`);
                        var uploadMessage= new MessageAttachment(read);
                        client.channels.resolve(fileChannel).send("File you requested: ", uploadMessage);
                        fs.unlink(`./temp/${file.name}`,()=>{});
                    });
                }
            );
        }
        else{
            client.channels.resolve(fileChannel).send("File size too large. Sending the direct download link instead");
            resolveShareLink(file.name,files);
        }
    }
    else{
        client.channels.resolve(fileChannel).send("File not found. Kindly check the name of the file and retry.");
    }
}


function uploadFile(messageAttachment, fileName, current){
    var destination=fs.createWriteStream(`./temp/${fileName}`);
    var metaData={
        'name': `${fileName}`,
        "parents":`['${current}']`
    };
    request.get(messageAttachment.attachment).pipe(destination)
        .on('finish', ()=>{
            var media={
                body: fs.createReadStream(`./temp/${fileName}`)
            };
            drive.files.create({
                resource: metaData,
                media: media
            },(err,res)=>{
                if(err){
                    console.log(err);
                }
                client.channels.resolve(fileChannel).send("File uploaded successfully");
                fs.unlink(`./temp/${fileName}`, ()=>{});
            });
        });
}


client.on('ready', () => {
    console.log("Logged in");
    client.user.setActivity("Testing", {type: 'WATCHING'}).then((presence) => {},
    (reason) =>{
        console.log("Error");
        console.error(reason);
    });
    fs.readFile('./secrets/credentials.json', (err, content) => {
        if (err){
            return console.log('Error loading client secret file:', err);
        }
        authorize(JSON.parse(content), getRootID);
    });
});


client.on('message', (message) => {

    if(message.author.bot){
        return;
    }

    if(message.content.startsWith(prefix)){
        const userInput=getCommands(message.content);
        const command=userInput[0];
        const args=userInput[1];
        delete userInput;
        if(command=="files"){
            if(args.length>1){
                if(args[0].toLowerCase()=='o'){
                    if(args[1]==".."){
                        reverseTraverse();
                    }
                    else{
                        resolveID(args[1], files);
                    }
                }
                else if(args[0].toLowerCase()=='s'){
                    resolveShareLink(args[1],files);
                }
                else if(args[0].toLowerCase()=='d'){
                    downloadFile(args[1],files);
                }
                else if(args[0].toLowerCase()=='u'){
                    message.attachments.forEach(
                        (attachment)=>{
                            uploadFile(attachment,args[1],currentID);
                        }
                    )
                }
                else{
                    message.author.send("Wrong command. Kindly check your command and try again.\nYou can also seek help using '.help' command.");
                }
            }
            else{
                getDirectory(rootID);
            }
        }
    }
});