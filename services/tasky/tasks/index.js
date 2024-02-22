import axios from "axios";

function getTasks() {
  const taskyUrlApi = process.env.EXPO_PUBLIC_TASKY_URL_API;

  return axios.get(`${taskyUrlApi}/tasks`).then(async (response) => {
    const data = await response.data.tasks;
    return data;
  });
  // .catch((error) => {
  //   console.log(error);
  // });
}

export default getTasks;
