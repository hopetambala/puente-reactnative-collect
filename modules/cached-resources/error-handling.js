import { Parse } from 'parse/react-native';
import { retrieveSignInFunction } from '../../services/parse/auth';
import { getData } from '../async-storage';

export default async function handleParseError(err, functionToCall) {
  return new Promise((resolve, reject) => {
    if (err.code === Parse.Error.INVALID_SESSION_TOKEN) {
      getData('credentials').then((user) => {
        retrieveSignInFunction(user.username, user.password).then(() => {
          functionToCall().then(() => {
            resolve(true);
          });
        }, (error) => {
          reject(error);
        });
      });
    }
  });
}
