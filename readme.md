# FileBOT

A bot for discord with support for accessing Google Drive Storage from the discord chat itself. Further functionality will be added in the future. 

## Installation and Configuration

Follow the steps provided to install and configure the bot. 

1) cd to the project directory

```bash
cd file-bot-discord
```

2) Install dependencies using npm. 

```bash
npm install
```

3) Get your drive API credentials from Google Cloud Platform. Refer to this [URL](https://developers.google.com/drive/api/v3/enable-drive-api) for help.

4) Run the following command to properly get the ".env" file ready for use and follow on screen steps.

```bash 
npm run configuration
```

5) Once done start up the bot using the following command 

```bash 
npm run start
```

Note: - First time use will prompt you to authorize the app to link to your Google Account. Follow the steps shown on the screen to do so. 

# Contributing

Pull requests are always welcome to add further functionality or to fix any broken stuff. 