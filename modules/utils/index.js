const generateRandomID = () => Math.random().toString(20).substr(2, 12);
const isEmpty = (str) => (!str || str === undefined || str.length === 0 || !/\S/.test(str));

export { isEmpty, generateRandomID };
