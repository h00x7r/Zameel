const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();

const config = {
    user: "if0_35749460",
    password: "Ue2OQwPxBj", // Glitch FTP password
    host: "ftpupload.net",
    port: 21,
    localRoot: __dirname,
    remoteRoot: "/htdocs",
    include: ['*', '**/*'],
    exclude: [
        'node_modules/**',
        '.git/**',
        '.env',
        'deploy.js',
        'ftpconfig.json',
        '*.log'
    ],
    deleteRemote: false,
    forcePasv: true
};

ftpDeploy
    .deploy(config)
    .then(res => console.log('Finished deploying'))
    .catch(err => console.log(err));
