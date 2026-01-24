function calculateOffset(date: Date = new Date()) {
  return date.getMinutes() * 60 + date.getSeconds();
}

export default calculateOffset;
