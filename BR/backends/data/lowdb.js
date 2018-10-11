const low = require('lowdb');
const shortId = require('shortid');
const { join } = require('path')
const FileSync = require('lowdb/adapters/FileSync')

const listPath = join(process.cwd(), 'private', 'lists.json');
const listAdapter = new FileSync(listPath);
const listDB = low(listAdapter);

const dataPath = join(process.cwd(), 'private', 'data.json');
const dataAdapter = new FileSync(dataPath);
const dataDB = low(dataAdapter);

listDB.defaults({ characters: [], places: [], fractions: [], mobs: [] }).write();
dataDB.defaults({ data: [] }).write();

const getElementData = (id, cb) => {
  const data = dataDB.get('data').find({ id }).value();
  if (!data) {
    cb('Data not Found', null);
  }
  cb(null, data);
}

const getCharacterList = (cb) => {
  const characters = listsDB.get('characters').value();
  return cb(null, characters);
}

const getPlaceList = (cb) => {
  const places = listDB.get('places').value();
  return cb(null, places);
}

const getFractionList = (cb) => {
  const fractions = listDB.get('fractions').value();
  return cb(null, fractions);
}

const getMobList = (cb) => {
  const mobs = listDB.get('mobs').value();
  return cb(null, mobs);
}

const getAllLists = (cb) => {
  const lists = listDB.getState();
  cb(null, lists);
};

const changeElementInList = (element, list, cb) => {
  listDB.get(list).find({ id: element.id }).assign(element).write();
  return cb(null, true);
}

const removeElementFromList = (id, list, cb) => {
  listDB.get(list).remove({id}).write();
  return cb(null, true);
}

const addElementToList = (element, list, cb) => {
  listDB.get(list).push(element).write();
  return cb(null, true);
} 

const changeElementData = (element, cb) => {
  dataDB.get('data').find({ id: element.id }).assign(element).write();
  return cb(null, true);
}

const addElementData = (data, cb) => {
  dataDB.get('data').push(data).write();
  return cb(null, true);
}

const removeElementData = (id, cb) => {
  dataDB.get('data').remove({id}).write();
  return cb(null, true);
}

const changeElement = (element, cb) => {
  const listElement = {
    id: element.id,
    imgSrc: element.imgSrc,
    name: element.name,
  }
  changeElementInList(listElement, element.type, (err, res) => {
    changeElementData(listElement, cb);
  });
}

const addElement = (element, cb) => {
  element.id = element.id || shortId.generate();
  const listElement = {
    id: element.id,
    imgSrc: element.imgSrc,
    name: element.name,
  }
  addElementToList(listElement, element.type, (err, res) => {
    addElementData(element, cb);
  });
}

const removeElement = (id, type, cb) => {
  removeElementFromList(id, type, (err, res) => {
    removeElementData(id, cb);
  })
}


module.exports = {
  getAllLists,
  getElementData,
  addElement,
  removeElement,
  changeElement,
}
