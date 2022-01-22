import { Parse } from 'parse/react-native';

import { customMultiParamQueryService, customMultiValueArrayService, customQueryService } from './custom-queries';

function retrieveHelloFunction() {
  Parse.Cloud.run('hello').then((result) => result);
}
function residentIDQuery(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('basicQuery', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function countService(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('countService', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function postObjectsToClass(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('postObjectsToClass', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function postObjectsToClassWithRelation(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('postObjectsToClassWithRelation', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function getObjectsByGeolocation(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('geoQuery', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

function postOfflineForms(params) {
  return new Promise((resolve, reject) => {
    Parse.Cloud.run('postOfflineForms', params).then((result) => {
      resolve(result);
    }, (error) => {
      reject(error);
    });
  });
}

export {
  countService,
  customMultiParamQueryService,
  customMultiValueArrayService,
  customQueryService,
  getObjectsByGeolocation,
  postObjectsToClass,
  postObjectsToClassWithRelation,
  postOfflineForms,
  residentIDQuery,
  retrieveHelloFunction
};
