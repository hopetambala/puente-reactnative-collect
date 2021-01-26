import checkOnlineStatus from '../../../../../modules/offline';
import { getAllData, getData, deleteData } from '../../../../../modules/async-storage';
import { postObjectsToClass } from '../../../../../services/parse/crud';

// similar to componentDidMount and componenetWillUnmount
// runs every 10 seconds in the background to get all Async Data
const backgroundPostPatient = () => {
  checkOnlineStatus()
    .then((isConnected) => {
      // only post if connected to internet
      if (isConnected) {
        getAllData().then((allAsyncData) => {
          // contains all the available keys
          const allKeys = allAsyncData.map((a) => a[0]);
          allKeys.forEach((item) => {
            // console.log(item);
            // check for PatiendID objects stored in async
            if (item.includes('PatientID-')) {
              getData(item)
                .then((postParams) => {
                  postObjectsToClass(postParams);
                  // console.log(item, 'POSTED');
                  // delete item from async after it has been posted to parse
                  deleteData(item);
                });
            }
          });
        });
      }
    });
};

export default backgroundPostPatient;
