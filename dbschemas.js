module.exports = (mongoose) => {
  const replySchema = new mongoose.Schema({
    text: {type: String, required: true},
    created_on: {type: Date, default: Date.now},
    delete_password: {type: String, required: true},
    reported: {type: Boolean, default: false}
  });
  
  const threadSchema = new mongoose.Schema({
    text: {type: String, required: true},
    created_on: {type: Date, default: Date.now},
    bumped_on: {type: Date, default: Date.now},
    reported: {type: Boolean, default: false},
    delete_password: {type: String, required: true},
    replies: [replySchema]
  });
  
  const boardSchema = new mongoose.Schema({
    name: {type: String, required: true},
    threads: [threadSchema]
  });
  
  const Board = mongoose.model('Board', boardSchema);
  
  return Board;
}
