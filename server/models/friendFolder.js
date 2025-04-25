const mongoose = require('mongoose');

const friendFolderSchema = new mongoose.Schema({
   owner: mongoose.SchemaTypes.ObjectId,
   parent: mongoose.SchemaTypes.ObjectId,
   title: String,
   folders: {
      type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'friendFolder' }],
   },
   users: {
      type: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'user' }],
   }
});

module.exports = mongoose.model("friendFolder", friendFolderSchema);