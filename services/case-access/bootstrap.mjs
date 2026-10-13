// Writes secrets locally, never to the public site. Does not run SQL or deploy.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {hashAdminPassword,randomPassword} from './crypto.mjs';
const directory=new URL('./.local/',import.meta.url);
await mkdir(directory,{recursive:true,mode:0o700});
const vars=new URL('./.dev.vars',import.meta.url);
let secret;
try{secret=(await readFile(vars,'utf8')).match(/^CASE_SECRET="?([^"\n]+)/m)?.[1];if(!secret)throw new Error('CASE_SECRET missing');}catch(e){if(e.code!=='ENOENT')throw e;secret=randomBytes(32).toString('base64');await writeFile(vars,`CASE_SECRET="${secret}"\n`,{mode:0o600,flag:'wx'});}
const username='admin',password=process.env.CASE_ADMIN_PASSWORD||randomPassword(),mac=await hashAdminPassword(secret,username,password);
// Fail rather than overwrite an existing administrator on repeated imports.
await writeFile(new URL('bootstrap.sql',directory),`INSERT INTO users(id,username,role,password_mac,password_cipher,can_demo,can_download,created_at) VALUES('${crypto.randomUUID()}','${username}','admin','${mac}',NULL,1,1,${Math.floor(Date.now()/1000)});\n`,{mode:0o600,flag:'wx'});
await writeFile(new URL('admin-login.txt',directory),`本地开发管理员（未部署）\n用户名：${username}\n密码：${password}\n`,{mode:0o600,flag:'wx'});
console.log('Created .local/bootstrap.sql and .local/admin-login.txt (private, gitignored). Import bootstrap.sql into the intended D1 database.');
