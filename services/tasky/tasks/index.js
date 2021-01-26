import axios from 'axios';
import selectedENV from '../../../environment';

function getTasks() {
  const { taskyUrlApi } = selectedENV;

  return axios.get(`${taskyUrlApi}/tasks`)
    .then(async (response) => {
      const data = await response.data.tasks;
      return data;
    });
  // .catch((error) => {
  //   console.log(error);
  // });
}

export default getTasks;
