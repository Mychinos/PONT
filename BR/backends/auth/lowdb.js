const low = require('lowdb');
const { join } = require('path')
const FileSync = require('lowdb/adapters/FileSync')

const path = join(process.cwd(), 'private', 'user.json');

const adapter = new FileSync(path);
const db = low(adapter);

db.defaults({ users: [] }).write();

const isKnown = (user, secret) => {
  const user = db.get('users').find({ name: user, secret: secret });
  if (!user) {
    return false;
  }
  return user;
}
