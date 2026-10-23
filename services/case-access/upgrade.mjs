// CLI generates reviewable SQL without connecting to a database. applyUpgrade accepts an explicit D1 binding.
// Input contains no passwords.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {caseIds} from '../../website/assets/case-catalog.mjs';
const q=value=>"'"+String(value).replaceAll("'","''")+"'";
export function upgradeStatements(users,ownerId,decisions={}) {
 if(!Array.isArray(users)||!users.length)throw new Error('A nonempty account inventory is required');
 if(new Set(users.map(u=>u.id)).size!==users.length)throw new Error('Duplicate account IDs');
 const owner=users.find(u=>u.id===ownerId);
 if(!owner||owner.username!=='admin'||owner.role!=='admin')throw new Error('Explicit existing admin account ID required');
 if(users.some(u=>u.role==='admin'&&u.id!==ownerId))throw new Error('Unexpected existing administrators require review');
 if(Object.keys(decisions).some(id=>!users.some(u=>u.id===id&&u.role==='user')))throw new Error('Decision contains unknown user');
 const sql=["CREATE TABLE upgrade_assert(ok INTEGER NOT NULL CHECK(ok=1));",
 "INSERT INTO upgrade_assert SELECT CASE WHEN (SELECT ready FROM access_settings WHERE id=1)=0 THEN 1 ELSE 0 END;",
 `INSERT INTO upgrade_assert SELECT CASE WHEN (SELECT COUNT(*) FROM users)=${users.length} THEN 1 ELSE 0 END;`];
 for(const u of users){
  if(!['user','admin'].includes(u.role)||![0,1].includes(u.can_demo)||![0,1].includes(u.can_download))throw new Error('Invalid inventory');
  sql.push(`INSERT INTO upgrade_assert SELECT CASE WHEN EXISTS(SELECT 1 FROM users WHERE id=${q(u.id)} AND username=${q(u.username)} AND role=${q(u.role)} AND can_demo=${u.can_demo} AND can_download=${u.can_download} AND is_owner=0 AND disabled_at IS NULL) THEN 1 ELSE 0 END;`);
 }
 sql.push(`UPDATE users SET is_owner=1 WHERE id=${q(ownerId)};`,'DELETE FROM case_grants;');
 for(const u of users.filter(u=>u.role==='user')){
  let ids=decisions[u.id];
  if(ids===undefined){if(u.can_demo!==u.can_download)throw new Error(`Explicit case decision required for ${u.username} (${u.id})`);ids=u.can_demo?caseIds:[];}
  if(!Array.isArray(ids)||ids.some(id=>!caseIds.includes(id))||new Set(ids).size!==ids.length)throw new Error('Invalid case decision');
  for(const id of ids)sql.push(`INSERT INTO case_grants(user_id,case_id) VALUES(${q(u.id)},${q(id)});`);
 }
 sql.push('DELETE FROM sessions;','UPDATE access_settings SET ready=1 WHERE id=1;','DROP TABLE upgrade_assert;');
 return sql;
}
export function upgradeSQL(users,ownerId,decisions={}){return upgradeStatements(users,ownerId,decisions).join('\n')+'\n';}
export async function applyUpgrade(db,users,ownerId,decisions={}){
 return db.batch(upgradeStatements(users,ownerId,decisions).map(sql=>db.prepare(sql)));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [inventory,owner,output,decisions]=process.argv.slice(2);
 if(!inventory||!owner||!output)throw new Error('Usage: node upgrade.mjs inventory.json OWNER_ID output.sql [decisions.json]');
 await writeFile(output,upgradeSQL(JSON.parse(await readFile(inventory,'utf8')),owner,decisions?JSON.parse(await readFile(decisions,'utf8')):{}),{flag:'wx',mode:0o600});
 console.log('Reviewable migration SQL generated; no database accessed. Execute atomically during account maintenance.');
}
