import { postObjectsToClass } from "@app/services/parse/crud";
import { deleteData, getAllData, getData } from "@modules/async-storage";
import checkOnlineStatus from "@modules/offline";

// similar to componentDidMount and componenetWillUnmount
// runs every 10 seconds in the background to get all Async Data
const backgroundPostPatient = () => {
  checkOnlineStatus().then((isConnected) => {
    // only post if connected to internet
    if (isConnected) {
      getAllData().catch(() => []).then((allAsyncData) => {
        // contains all the available keys
        const allKeys = allAsyncData.map((a) => a[0]);
        allKeys.forEach((item) => {
          // console.log(item);
          // check for PatiendID objects stored in async
          if (item.includes("PatientID-")) {
            getData(item).then((postParams) => {
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
